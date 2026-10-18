import { prisma } from '@/lib/db';
import { getAuthUser, json } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);
  if (user.role !== 'ADMIN') return json({ ok: false, error: 'Acesso negado' }, 403);

  const [users, queries, accounts] = await Promise.all([
    prisma.user.count(),
    prisma.queryRequest.count(),
    prisma.creditAccount.findMany({ orderBy: { balance: 'desc' }, take: 5 }),
  ]);

  return json({
    ok: true,
    summary: {
      users,
      queries,
      accounts: accounts.map((a) => ({ userId: a.userId, balance: a.balance })),
    },
  });
}
