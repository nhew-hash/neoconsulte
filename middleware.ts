# NeoConsulte

NeoConsulte é uma base SaaS moderna para consultas, gestão de créditos e painel administrativo. O projeto foi estruturado com foco em arquitetura segura, séparation de provider, ledger de créditos e UI premium.

## Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite para desenvolvimento local
- Provider mock para simulação de consultas

## Requisitos

- Node.js 18+
- npm ou pnpm

## Setup local

1. Instale as dependências
   npm install
2. Gere o cliente Prisma
   npm run db:generate
3. Execute as migrações
   npm run db:push
4. Popular dados demo
   npm run db:seed
5. Rode a aplicação
   npm run dev

Acesse http://localhost:3000.

## Demonstração de acesso

- Cliente: cliente@neoconsulte.demo / demo123
- Admin: admin@neoconsulte.demo / demo123

## Estrutura principal

- `app/` — páginas públicas, dashboard, admin e APIs
- `lib/` — helpers, mocks e providers
- `prisma/` — schema e seed
- `middleware.ts` — proteção de rotas base

## Observação importante

O provider atual é simulado (`mock`). Ele foi pensado para permitir evolução segura para Telegram ou outro fornecedor externo, sem expor tokens ou sessões ao navegador.

## Produção

Para uma implantação real, configure corretamente:

- DATABASE_URL para PostgreSQL
- NEXTAUTH_SECRET e NEXTAUTH_URL
- provider authorization flags
- Stripe/webhook secrets quando a cobrança real existir
- monitoramento, rate limit e logs sem dados sensíveis

## Status do projeto

Este é um scaffold funcional e seguro para as etapas iniciais do produto. Ele oferece base operacional para autenticação demo, dashboards, provider mock, créditos e administração. Integrações reais exigem autorização e documentação do fornecedor.
