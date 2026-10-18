import { prisma } from '@/lib/db';
import { getAuthUser, json } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);

  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });

  const transactions = account
    ? await prisma.creditTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : [];

  return json({
    ok: true,
    balance: account?.balance ?? 0,
    available: account?.balance ?? 0,
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.createdAt.toISOString(),
      type: t.type,
      amount: t.amount,
      reference: t.reference,
      note: t.reason,
    })),
  });
}
