# NeoConsulte

NeoConsulte is a modern SaaS foundation for query operations, credit management, and admin oversight. The project is structured for secure backend validation, provider abstraction, credit ledger integrity, and a premium UI.

## Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite for local development
- Mock provider for demo mode

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
4. Apply schema to SQLite
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
