import logging
import smtplib
from email.message import EmailMessage

from app.core.config import Settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, token: str, settings: Settings) -> None:
    reset_url = f"{settings.frontend_url.rstrip('/')}/redefinir-senha?token={token}"
    subject = "Redefina sua senha do Finora"
    body = (
        "Recebemos uma solicitação para redefinir a senha da sua conta Finora.\n\n"
        f"Use este link em até {settings.password_reset_minutes} minutos:\n{reset_url}\n\n"
        "Se você não solicitou essa alteração, ignore esta mensagem."
    )

    if settings.email_backend == "console":
        if settings.app_env not in {"development", "test"}:
            raise RuntimeError("O envio de e-mail pelo console só pode ser usado em desenvolvimento.")
        logger.warning("[FINORA DEV EMAIL] Para: %s | Assunto: %s\n%s", email, subject, body)
        return

    if not settings.smtp_host:
        raise RuntimeError("SMTP_HOST não foi configurado.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.email_from
    message["To"] = email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_starttls:
            smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password or "")
        smtp.send_message(message)
