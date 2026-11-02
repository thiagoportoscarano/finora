# Dados sintéticos usados exclusivamente no SQLite em memória criado em tests/conftest.py.
# Nenhum desses registros é gravado no banco de desenvolvimento.
def test_authentication_lifecycle(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"name": "Usuário temporário de teste", "email": "usuario@example.com", "password": "senha-temporaria-de-teste"},
    )
    assert register.status_code == 201

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "usuario@example.com", "password": "senha-temporaria-de-teste"},
    )
    assert login.status_code == 200
    assert "access_token" in client.cookies
    assert "refresh_token" in client.cookies

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "usuario@example.com"
    assert me.json()["name"] == "Usuário temporário de teste"

    refresh = client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 200

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 204

    after_logout = client.get("/api/v1/auth/me")
    assert after_logout.status_code == 401


def test_duplicate_email_is_rejected(client):
    payload = {"name": "Usuário temporário de teste", "email": "usuario@example.com", "password": "senha-temporaria-de-teste"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    duplicate = client.post("/api/v1/auth/register", json=payload)
    assert duplicate.status_code == 409


def test_login_with_wrong_password_is_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Usuário temporário de teste", "email": "usuario@example.com", "password": "senha-temporaria-de-teste"},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "usuario@example.com", "password": "senha-incorreta-de-teste"},
    )
    assert response.status_code == 401


def test_password_reset_invalidates_existing_session(client, caplog):
    import logging
    import re

    client.post(
        "/api/v1/auth/register",
        json={"name": "Usuário temporário de teste", "email": "usuario@example.com", "password": "senha-temporaria-de-teste"},
    )
    client.post(
        "/api/v1/auth/login",
        json={"email": "usuario@example.com", "password": "senha-temporaria-de-teste"},
    )
    assert client.get("/api/v1/auth/me").status_code == 200

    with caplog.at_level(logging.WARNING, logger="app.services.email"):
        forgot = client.post("/api/v1/auth/forgot-password", json={"email": "usuario@example.com"})
    assert forgot.status_code == 202

    log_text = "\n".join(record.getMessage() for record in caplog.records)
    token_match = re.search(r"redefinir-senha\?token=([A-Za-z0-9_-]+)", log_text)
    assert token_match is not None

    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token_match.group(1), "password": "senha-nova-temporaria-de-teste"},
    )
    assert reset.status_code == 200
    assert client.get("/api/v1/auth/me").status_code == 401

    old_password = client.post(
        "/api/v1/auth/login",
        json={"email": "usuario@example.com", "password": "senha-temporaria-de-teste"},
    )
    assert old_password.status_code == 401
    new_password = client.post(
        "/api/v1/auth/login",
        json={"email": "usuario@example.com", "password": "senha-nova-temporaria-de-teste"},
    )
    assert new_password.status_code == 200
