# NeoConsulte

NeoConsulte is a modern SaaS foundation for query operations, credit management, and admin oversight. The project is structured for secure backend validation, provider abstraction, credit ledger integrity, and a premium UI.

## Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Neon, Supabase, Vercel Postgres ou local)
- Mock provider for demo mode
- Fila assíncrona de consultas com worker (transporte plugável)

## Requirements

- Node.js 18+
- npm

## Local setup

1. Create the env file
   cp .env.example .env
2. Install dependencies
   npm install
3. Generate Prisma client
   npm run db:generate
4. Apply schema to PostgreSQL (set DATABASE_URL in .env first)
   npm run db:push
5. Seed demo data (development only)
   npm run db:seed
6. Run the app
   npm run dev

Open http://localhost:3000.

## Demo accounts

- Client: cliente@neoconsulte.demo / demo12345
- Admin: admin@neoconsulte.demo / demo12345 (override with SEED_PASSWORD)

## Key directories

- `app/` — public routes, dashboards, and route handlers
- `lib/` — mock data, databases, and provider abstractions
- `prisma/` — database schema and seed data
- `middleware.ts` — base route protection for authenticated flows

## Important note

The current provider is intentionally set to demo mode (`mock`). This architecture is prepared for future authorized Telegram or external provider integration without exposing tokens or sessions to the browser.

## Production checklist

- Use PostgreSQL or a managed database in production
- Configure production secrets through environment variables
- Validate provider authorization and legal compliance before activating live data access
- Set up payment provider and webhook verification if charging real funds
- Keep logs free of sensitive personal data


## Fila assíncrona de consultas

Fluxo: o site registra a solicitação (débito atômico e idempotente) -> o **worker** envia pelo `QueryTransport`
configurado -> a resposta chega por `ingestResponse` (callback do transporte ou `POST /api/internal/inbound`)
-> o resultado aparece no histórico.

Estados: `WAITING` -> `PROCESSING` -> `COMPLETED` | `FAILED` | `REVIEW` (resposta inesperada, revisão manual).

Garantias:

- **Cobrança única:** `Idempotency-Key` evita cobrança duplicada; falha, erro do provider e timeout estornam **uma única vez**.
- **Correlação:** resposta só é associada por `correlationId` exato e mesmo transporte; mensagens duplicadas, sem correlação ou
  atrasadas (após timeout) são ignoradas e nunca alteram outra solicitação.
- **Sem invenção de resultado:** texto fora do formato vai para `REVIEW`; admin encerra com estorno em
  `POST /api/admin/queries/<id>/resolve`.
- **Dados protegidos:** entrada e resultado ficam criptografados (AES-256-GCM, `DATA_ENCRYPTION_KEY`); a entrada é apagada
  após o envio; o histórico guarda apenas valor mascarado; consultas só são lidas pelo dono; logs não registram conteúdo.

Rodando localmente (dois terminais):

    npm run db:push      # aplica o schema novo
    npm run dev          # site
    npm run worker       # envia e acompanha as solicitações

Transporte `demo` (padrão): não consulta dado real. O último caractere da entrada define o comportamento:
`0` erro simulado, `8` mensagem fora do formato (vai para revisão), `9` sem resposta (timeout), outro = resultado simulado.

Testes (exigem `TEST_DATABASE_URL`, um Postgres SEPARADO; nenhuma consulta real):

    npm test

Novos canais: implemente `QueryTransport` (`lib/queue/types.ts`) e registre em `lib/queue/registry.ts`.
Use somente fontes com contrato/autorização para os dados consultados. Não há adaptador de Telegram neste projeto.

Variáveis: `QUERY_TRANSPORT`, `QUERY_TIMEOUT_SECONDS`, `WORKER_INTERVAL_MS`, `INBOUND_SECRET`, `DATA_ENCRYPTION_KEY`
(veja `.env.example`).

## Deploy (Vercel)

1. Crie um banco PostgreSQL (Neon, Supabase ou Vercel Postgres) e copie a URL.
2. Uma vez, da sua máquina, com `DATABASE_URL` apontando para esse banco: `npm run db:push` e, se quiser contas demo, `npm run db:seed`.
3. Na Vercel, em Settings > Environment Variables, defina: `DATABASE_URL`, `DATA_ENCRYPTION_KEY`, `QUERY_TRANSPORT=demo`,
   `QUERY_TIMEOUT_SECONDS=120` (e `INBOUND_SECRET` se for usar o webhook). Não defina `NODE_ENV`.
4. Build Command padrão (`npm run build` = `prisma generate && next build`); o build não acessa o banco.

O worker (`npm run worker`) é um processo contínuo e **não roda na Vercel**: rode-o em outro serviço (Railway, Fly.io, VPS)
com as mesmas variáveis. Sem ele, as consultas ficam em "Aguardando" até o timeout e são estornadas.
