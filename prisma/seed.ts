import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@neoconsulte.demo' },
    update: {},
    create: {
      email: 'cliente@neoconsulte.demo',
      name: 'Ana Costa',
      passwordHash: await bcrypt.hash('demo123', 10),
      role: Role.CUSTOMER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@neoconsulte.demo' },
    update: {},
    create: {
      email: 'admin@neoconsulte.demo',
      name: 'Admin Neo',
      passwordHash: await bcrypt.hash('demo123', 10),
      role: Role.ADMIN,
    },
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

  const customerAccount = await prisma.creditAccount.upsert({
    where: { userId: customer.id },
    update: { balance: 18 },
    create: { userId: customer.id, balance: 18 },
  });

  const adminAccount = await prisma.creditAccount.upsert({
    where: { userId: admin.id },
    update: { balance: 999 },
    create: { userId: admin.id, balance: 999 },
  });

  await prisma.creditTransaction.createMany({
    data: [
      { accountId: customerAccount.id, amount: 30, type: 'purchase', reason: 'Compra avulsa', reference: 'demo-purchase', metadata: 'Seed' },
      { accountId: customerAccount.id, amount: -2, type: 'consumed', reason: 'Consulta de CPF', reference: 'query-demo', metadata: 'Seed' },
      { accountId: adminAccount.id, amount: 999, type: 'purchase', reason: 'Saldo administrativo', reference: 'admin-bootstrap', metadata: 'Seed' },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
