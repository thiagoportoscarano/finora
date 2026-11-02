import logging
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, validate_request_origin
from app.core.config import Settings, get_settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    sha256_hex,
    verify_password,
)
from app.db.session import get_db
from app.models.auth_session import AuthSession
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UserRead,
)
from app.services.email import send_password_reset_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, settings: Settings) -> None:
    common = {
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "path": "/",
        "domain": settings.cookie_domain,
    }
    response.set_cookie(
        "access_token",
        access_token,
        max_age=settings.access_token_minutes * 60,
        httponly=True,
        **common,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        httponly=True,
        **common,
    )


def _clear_auth_cookies(response: Response, settings: Settings) -> None:
    common = {
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "path": "/",
        "domain": settings.cookie_domain,
    }
    response.delete_cookie("access_token", httponly=True, **common)
    response.delete_cookie("refresh_token", httponly=True, **common)


def _start_session(db: Session, user: User, response: Response, settings: Settings) -> None:
    session_id = uuid.uuid4()
    refresh_token, refresh_jti_hash, refresh_expires_at = create_refresh_token(user.id, session_id, settings)
    db.add(
        AuthSession(
            id=session_id,
            user_id=user.id,
            refresh_jti_hash=refresh_jti_hash,
            expires_at=refresh_expires_at,
        )
    )
    db.commit()
    access_token = create_access_token(user.id, session_id, settings)
    _set_auth_cookies(response, access_token, refresh_token, settings)


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validate_request_origin)])
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    email = str(payload.email).strip().lower()
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Este e-mail já está cadastrado.") from None
    return MessageResponse(message="Conta criada com sucesso. Você já pode entrar.")


@router.post("/login", response_model=MessageResponse, dependencies=[Depends(validate_request_origin)])
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageResponse:
    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

    _start_session(db, user, response, settings)
    return MessageResponse(message="Autenticação realizada com sucesso.")


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/refresh", response_model=MessageResponse, dependencies=[Depends(validate_request_origin)])
def refresh_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageResponse:
    token = request.cookies.get("refresh_token")
    payload = decode_token(token, settings) if token else None
    if not payload or payload.get("type") != "refresh" or not isinstance(payload.get("jti"), str):
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido ou expirado.")

    try:
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["sid"])
    except (KeyError, ValueError, TypeError):
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido.") from None

    auth_session = db.get(AuthSession, session_id)
    now = datetime.now(UTC)
    if (
        auth_session is None
        or auth_session.user_id != user_id
        or auth_session.revoked_at is not None
        or _utc(auth_session.expires_at) <= now
        or not secrets.compare_digest(auth_session.refresh_jti_hash, sha256_hex(payload["jti"]))
    ):
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revogado ou reutilizado.")

    new_refresh_token, new_jti_hash, new_expiry = create_refresh_token(user_id, session_id, settings)
    auth_session.refresh_jti_hash = new_jti_hash
    auth_session.expires_at = new_expiry
    db.commit()

    new_access_token = create_access_token(user_id, session_id, settings)
    _set_auth_cookies(response, new_access_token, new_refresh_token, settings)
    return MessageResponse(message="Sessão renovada.")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(validate_request_origin)])
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    payload = decode_token(access_token, settings) if access_token else None
    if not payload and refresh_token:
        payload = decode_token(refresh_token, settings)
    if payload and payload.get("sid"):
        try:
            session_id = uuid.UUID(payload["sid"])
            auth_session = db.get(AuthSession, session_id)
            if auth_session and auth_session.revoked_at is None:
                auth_session.revoked_at = datetime.now(UTC)
                db.commit()
        except ValueError:
            db.rollback()
    _clear_auth_cookies(response, settings)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(validate_request_origin)],
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageResponse:
    # Resposta genérica para não revelar se o e-mail está cadastrado.
    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is not None:
        raw_token = create_password_reset_token()
        now = datetime.now(UTC)
        db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
            .values(used_at=now)
        )
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=sha256_hex(raw_token),
                expires_at=now + timedelta(minutes=settings.password_reset_minutes),
            )
        )
        db.commit()
        try:
            send_password_reset_email(user.email, raw_token, settings)
        except Exception:
            # Não revela a existência da conta nem o estado do provedor de e-mail na resposta pública.
            logger.exception("Falha ao enviar e-mail de redefinição para %s", user.email)

    return MessageResponse(message="Se existir uma conta associada a esse e-mail, enviaremos as instruções.")


@router.post("/reset-password", response_model=MessageResponse, dependencies=[Depends(validate_request_origin)])
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    token_hash = sha256_hex(payload.token)
    reset_record = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))
    now = datetime.now(UTC)
    if (
        reset_record is None
        or reset_record.used_at is not None
        or _utc(reset_record.expires_at) <= now
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link de redefinição inválido ou expirado.")

    user = db.get(User, reset_record.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível redefinir esta senha.")

    user.password_hash = hash_password(payload.password)
    reset_record.used_at = now
    db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    db.commit()
    return MessageResponse(message="Senha redefinida com sucesso. Entre novamente com a nova senha.")
