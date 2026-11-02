# Finora — Backend

Backend inicial do projeto Finora, construído com Python, FastAPI, PostgreSQL e SQLAlchemy.

## Estado desta versão

Implementado:

- API versionada em `/api/v1`.
- Cadastro e login.
- Hash de senha com Argon2.
- JWT de acesso e refresh em cookies `HttpOnly`.
- Sessões persistidas no banco, rotação do refresh token e revogação no logout.
- Consulta do usuário autenticado.
- Solicitação e redefinição de senha.
- Envio de recuperação por console no desenvolvimento ou SMTP quando configurado.
- Migrations com Alembic.
- Testes automatizados do fluxo de autenticação.

Ainda não implementado: contas financeiras, lançamentos, categorias, orçamentos, relatórios e dashboard. Nenhum usuário, conta, saldo ou lançamento é pré-carregado no banco de desenvolvimento.

## Estrutura

```text
finora-backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/endpoints/
│   │       ├── auth.py
│   │       └── health.py
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   └── services/
├── alembic/
├── tests/
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Executar com Docker Compose

Requisitos: Docker Engine e Docker Compose instalados.

1. Copie o arquivo de ambiente:

```powershell
Copy-Item .env.example .env
```

2. Gere uma senha local para o PostgreSQL e uma chave JWT. Execute os comandos abaixo separadamente e copie cada resultado para o campo correspondente no arquivo `.env`:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(24))"
py -c "import secrets; print(secrets.token_urlsafe(48))"
```

Preencha `POSTGRES_PASSWORD` com o primeiro valor e `JWT_SECRET_KEY` com o segundo. Não publique o arquivo `.env` nem reutilize esses segredos em produção.

3. Inicie os serviços:

```powershell
docker compose up --build
```

O Compose sobe o PostgreSQL, aguarda o banco ficar saudável, aplica as migrations e inicia a API.

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

Para encerrar:

```powershell
docker compose down
```

Para apagar também o volume do banco local (esta operação apaga os dados armazenados nele):

```powershell
docker compose down -v
```

## Executar sem Docker

É necessário ter Python 3.12+ e PostgreSQL instalado e em execução. Copie `.env.example` para `.env`, gere `JWT_SECRET_KEY` conforme explicado acima e configure `DATABASE_URL` com os dados do PostgreSQL local. Depois:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Endpoints

Prefixo: `/api/v1`

| Método | Endpoint | O que faz | Autenticação |
|---|---|---|---|
| GET | `/health` | Verifica se a API responde | Não |
| POST | `/auth/register` | Cria usuário | Não |
| POST | `/auth/login` | Valida credenciais e inicia sessão | Não |
| GET | `/auth/me` | Retorna os dados do usuário atual | Sim |
| POST | `/auth/refresh` | Rotaciona refresh token e renova access token | Cookie refresh |
| POST | `/auth/logout` | Revoga a sessão e limpa cookies | Não exige token válido |
| POST | `/auth/forgot-password` | Solicita link de redefinição | Não |
| POST | `/auth/reset-password` | Redefine senha com token válido | Não |

Os payloads são definidos em `app/schemas/auth.py`. O frontend envia os campos `email` e `password` no login; no cadastro, envia `name`, `email` e `password`. Não há credenciais de usuário de demonstração.

Login define `access_token` e `refresh_token` como cookies `HttpOnly`; os tokens não são retornados no JSON.

## Recuperação de senha

Em desenvolvimento, `EMAIL_BACKEND=console`: depois de uma solicitação válida, o link de redefinição é registrado no terminal da API. Esse comportamento serve apenas para desenvolvimento e teste local; não representa envio de e-mail. Para envio real, configure `EMAIL_BACKEND=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_STARTTLS` e `EMAIL_FROM` com os dados do provedor escolhido.

Em produção, o modo console é bloqueado pela configuração.

## Segurança e configurações pendentes

- Senhas são armazenadas com Argon2.
- JWT de acesso dura 15 minutos por padrão; refresh dura 7 dias e é rotacionado a cada renovação.
- Sessões ficam registradas no banco. Logout e redefinição de senha revogam sessões ativas.
- Cookies são `HttpOnly` e `SameSite=Lax`; `Secure` fica desativado apenas no ambiente local. Em HTTPS, configure `COOKIE_SECURE=true`.
- A API restringe CORS às origens configuradas e valida o cabeçalho `Origin` nas operações de escrita.
- A chave `JWT_SECRET_KEY` é obrigatória e não possui segredo padrão no projeto. Gere um valor local antes de iniciar.

Antes de uma publicação, ainda é necessário implementar/revisar proteção CSRF, rate limiting, observabilidade, limpeza de tokens expirados, HTTPS, backups e política de privacidade. Esta base ainda não passou por auditoria de segurança.

## Migrations

A migration inicial cria `users`, `auth_sessions` e `password_reset_tokens`.

```bash
alembic upgrade head
alembic current
alembic downgrade -1
```

Não use `Base.metadata.create_all()` na aplicação em produção; a evolução do schema deve ser feita via Alembic.

## Testes

```bash
pytest -q
```

Os testes usam um SQLite em memória, criado e destruído para cada teste. Os nomes, e-mails e senhas sintéticos que aparecem em `tests/test_auth.py` existem somente durante a execução dos testes; não são inseridos no PostgreSQL nem disponibilizados aos usuários da aplicação.

## Próxima etapa

Depois de validar a autenticação no ambiente local, a próxima entrega do backend será a modelagem de contas e lançamentos financeiros. Esses módulos devem começar vazios e receber somente registros cadastrados pelos usuários.
