import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (process.env.NODE_ENV === 'production') {
  throw new Error('O seed de demonstração não deve rodar em produção.');
}

const prisma = new PrismaClient();
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'demo12345';

async function ensureAccount(userId: string, balance: number) {
  return prisma.creditAccount.upsert({
    where: { userId },
    update: {},
    create: { userId, balance },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const customer = await prisma.user.upsert({
    where: { email: 'cliente@neoconsulte.demo' },
    update: {},
    create: { email: 'cliente@neoconsulte.demo', name: 'Ana Costa', passwordHash, role: Role.CUSTOMER },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@neoconsulte.demo' },
    update: {},
    create: { email: 'admin@neoconsulte.demo', name: 'Admin Neo', passwordHash, role: Role.ADMIN },
  });

  await prisma.plan.upsert({
    where: { id: 'demo-plan-1' },
    update: {},
    create: {
      id: 'demo-plan-1',
      name: 'Plano Mensal',
      priceCents: 15000,
      active: true,
      version: 1,
      creditsIncluded: 50,
      validDays: 30,
      categoriesAllowed: 'CPF,CNPJ,Nome,Telefone,Placa',
    },
  });

  const customerAccount = await ensureAccount(customer.id, 28);
  const adminAccount = await ensureAccount(admin.id, 100);

  // Idempotent: only seed the ledger when the account has no transactions yet
  const existing = await prisma.creditTransaction.count({
    where: { accountId: { in: [customerAccount.id, adminAccount.id] } },
  });

  if (existing === 0) {
    await prisma.creditTransaction.createMany({
      data: [
        { accountId: customerAccount.id, amount: 30, type: 'purchase', reason: 'Compra avulsa', reference: 'demo-purchase', metadata: 'Seed' },
        { accountId: customerAccount.id, amount: -2, type: 'consumed', reason: 'Consulta de demonstração', reference: 'query-demo', metadata: 'Seed' },
        { accountId: adminAccount.id, amount: 100, type: 'purchase', reason: 'Saldo administrativo (demo)', reference: 'admin-bootstrap', metadata: 'Seed' },
      ],
    });
  }

  console.log(`Seed concluído. Senha demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
