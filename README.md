# pizzashop-api

API REST para gerenciamento de uma pizzaria, construída com **Bun**, **Elysia**, **Drizzle ORM** e **PostgreSQL**.

## Funcionalidades

- Cadastro de restaurantes e gerentes
- Autenticação via magic link (link enviado por e-mail)
- Gerenciamento de pedidos (aprovar, despachar, entregar, cancelar)
- Métricas do restaurante:
  - Receita mensal e diária
  - Quantidade de pedidos por dia e por mês
  - Pedidos cancelados no mês
  - Produtos mais populares
- Listagem de pedidos com filtros e paginação

## Tecnologias

- [Bun](https://bun.sh) — runtime e gerenciador de pacotes
- [Elysia](https://elysiajs.com) — framework HTTP
- [Drizzle ORM](https://orm.drizzle.team) — ORM com migrations
- [PostgreSQL](https://www.postgresql.org) — banco de dados
- [Nodemailer](https://nodemailer.com) — envio de e-mails
- [Zod](https://zod.dev) — validação de variáveis de ambiente

## Instalação

```bash
bun install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://docker:docker@localhost:5432/pizzashop
API_BASE_URL=http://localhost:3333
AUTH_REDIRECT_URL=http://localhost:5173
JWT_SECRET_KEY=sua-chave-secreta
```

Suba o banco de dados com Docker:

```bash
docker-compose up -d
```

Execute as migrations e popule o banco:

```bash
bun run migrate
bun run seed
```

## Uso

```bash
# Desenvolvimento (com hot reload)
bun run dev

# Produção
bun run build
bun run start
```

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `bun run dev` | Inicia o servidor em modo watch |
| `bun run build` | Gera o build de produção |
| `bun run migrate` | Executa as migrations |
| `bun run seed` | Popula o banco com dados de teste |
| `bun run generate` | Gera novas migrations |
| `bun run studio` | Abre o Drizzle Studio |

O servidor roda em `http://localhost:3333`.
