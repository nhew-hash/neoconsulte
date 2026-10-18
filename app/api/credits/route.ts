import { prisma } from '@/lib/db';
import { getSessionByToken } from '@/lib/session';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/neo_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return Response.json({ ok: false, error: 'Autenticação necessária' }, { status: 401 });
  }

  const session = await getSessionByToken(token);
  if (!session?.user) {
    return Response.json({ ok: false, error: 'Sessão inválida' }, { status: 401 });
  }

  const account = await prisma.creditAccount.findUnique({ where: { userId: session.user.id } });

  const transactions = await prisma.creditTransaction.findMany({
    where: { accountId: account?.id ?? '' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return Response.json({
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
