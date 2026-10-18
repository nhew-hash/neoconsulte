import { prisma } from '@/lib/db';

export async function GET() {
  const users = await prisma.user.count();
  const queries = await prisma.queryRequest.count();
  const accounts = await prisma.creditAccount.findMany({ orderBy: { balance: 'desc' }, take: 5 });

  return Response.json({
    ok: true,
    summary: {
      users,
      queries,
      accounts: accounts.map((a) => ({ userId: a.userId, balance: a.balance })),
    },
  });
}
