import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionByToken } from '@/lib/session';

export default async function AdminPage() {
  const token = cookies().get('neo_session')?.value;
  if (!token) redirect('/login');

  const session = await getSessionByToken(token);
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/dashboard');

  const userCount = await prisma.user.count();
  const queryCount = await prisma.queryRequest.count();
  const accounts = await prisma.creditAccount.findMany({ orderBy: { balance: 'desc' }, take: 5 });
  const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } });
  const failedQueries = await prisma.queryRequest.count({ where: { status: 'FAILED' } });
  const failureRate = queryCount > 0 ? Math.round((failedQueries / queryCount) * 100) : 0;
  const transportName = process.env.QUERY_TRANSPORT ?? 'demo';
  const grouped = await prisma.queryRequest.groupBy({ by: ['status'], _count: { _all: true } });
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const reviewItems = await prisma.queryRequest.findMany({
    where: { status: 'REVIEW' },
    take: 10,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, category: true, rawInput: true },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Administração</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Painel administrativo</h1>
          </div>
          <form action="/api/logout" method="POST">
            <button className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100">Sair</button>
          </form>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">Usuários</div><div className="mt-3 text-3xl font-semibold text-white">{userCount}</div><div className="mt-2 text-xs text-slate-400">Cadastros ativos</div></div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">Consultas</div><div className="mt-3 text-3xl font-semibold text-white">{queryCount}</div><div className="mt-2 text-xs text-slate-400">Total do sistema</div></div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">Pagamentos pendentes</div><div className="mt-3 text-3xl font-semibold text-white">{pendingPayments}</div><div className="mt-2 text-xs text-slate-400">Em validação</div></div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">Taxa de falhas</div><div className="mt-3 text-3xl font-semibold text-white">{failureRate}%</div><div className="mt-2 text-xs text-slate-400">Consultas com falha</div></div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Fila de consultas</h2>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200">Transporte: {transportName}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {[['WAITING', 'Aguardando'], ['PROCESSING', 'Processando'], ['COMPLETED', 'Concluídas'], ['FAILED', 'Falhas'], ['REVIEW', 'Em revisão'], ['CANCELLED', 'Canceladas']].map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{counts[key] ?? 0}</div>
              </div>
            ))}
          </div>
          {reviewItems.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-amber-300">Aguardando revisão manual</h3>
              <p className="mt-1 text-xs text-slate-400">Para encerrar com estorno: POST /api/admin/queries/&lt;id&gt;/resolve</p>
              <div className="mt-3 space-y-2">
                {reviewItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                    {item.id} · {item.category} · {item.rawInput}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white">Top saldos</h2>
          <div className="mt-5 space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="font-medium text-white">{account.userId}</div>
                <div className="text-sm text-slate-300">{account.balance} créditos</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
