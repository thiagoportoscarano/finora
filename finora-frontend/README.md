# Finora — Frontend

Frontend do projeto Finora, uma aplicação de controle financeiro pessoal com proposta multiusuário.

## Estado real desta versão

- Página de apresentação do projeto.
- Telas de login, cadastro, solicitação de recuperação e redefinição de senha.
- Cliente HTTP configurado para a API local.
- Tela autenticada de estado vazio.
- Aviso de cookies limitado ao cookie necessário para salvar a confirmação do próprio aviso.

Ainda não existem módulos de contas, lançamentos, orçamentos, relatórios ou dashboard financeiro. A interface não contém saldos, transações, gráficos ou usuários de demonstração.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- CSS próprio e Lucide React

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+.

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação ficará disponível no endereço exibido pelo Vite (normalmente `http://localhost:5173`).

Para validar a compilação:

```bash
npm run build
```

## Rotas

| Rota | Finalidade |
|---|---|
| `/` | Página de apresentação |
| `/login` | Login |
| `/cadastro` | Cadastro |
| `/recuperar-senha` | Solicitação de recuperação |
| `/redefinir-senha?token=...` | Definição de nova senha |
| `/app` | Área autenticada sem módulos financeiros |

## Integração com a API

A URL base é configurada por `VITE_API_BASE_URL`. O padrão local é `http://localhost:8000/api/v1`.

O frontend chama estes endpoints:

| Método | Endpoint | Payload |
|---|---|---|
| `POST` | `/auth/login` | `email`, `password` |
| `POST` | `/auth/register` | `name`, `email`, `password` |
| `POST` | `/auth/forgot-password` | `email` |
| `POST` | `/auth/reset-password` | `token`, `password` |
| `GET` | `/auth/me` | Sem payload |
| `POST` | `/auth/logout` | Sem payload |

O backend define os cookies de autenticação `HttpOnly`. O frontend usa `credentials: 'include'` e não grava senhas ou JWT em `localStorage`.

Como a autenticação usa cookies, a API precisa proteger as operações contra CSRF, aceitar somente as origens autorizadas e utilizar HTTPS quando publicada. A implementação atual valida o cabeçalho `Origin`, mas a proteção CSRF e a configuração de produção ainda precisam de revisão antes de disponibilização pública.

## Cookies

Nesta versão, o componente registra somente a confirmação do aviso em `finora_cookie_preferences`. Não há bibliotecas de analytics, publicidade ou personalização conectadas. O painel informa isso explicitamente e não oferece controles para categorias que ainda não são utilizadas.

## Observações

- O nome Finora é provisório.
- O módulo financeiro ainda não foi implementado.
- O texto jurídico e a política de privacidade definitivos ainda não existem.
- A recuperação de senha depende da configuração de um provedor de e-mail no backend; em desenvolvimento, o link é registrado no terminal da API.
