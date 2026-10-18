import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionByToken } from '@/lib/session';
import QueriesPanel from './queries-panel';

export default async function DashboardPage() {
  const token = cookies().get('neo_session')?.value;
  if (!token) redirect('/login');

  const session = await getSessionByToken(token);
  if (!session?.user) redirect('/login');

  const account = await prisma.creditAccount.findUnique({ where: { userId: session.user.id } });
  const recentQueries = await prisma.queryRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Olá, {session.user.name ?? session.user.email}</h1>
          </div>
          <form action="/api/logout" method="POST">
            <button className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100">Sair</button>
          </form>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Saldo de créditos</div>
            <div className="mt-3 text-3xl font-semibold text-white">{account?.balance ?? 0}</div>
            <div className="mt-2 text-xs text-slate-400">Disponível</div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Consultas no período</div>
            <div className="mt-3 text-3xl font-semibold text-white">{recentQueries.length}</div>
            <div className="mt-2 text-xs text-slate-400">Últimos registros</div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Solicitações em processamento</div>
            <div className="mt-3 text-3xl font-semibold text-white">{recentQueries.filter((q) => q.status === 'WAITING' || q.status === 'PROCESSING').length}</div>
            <div className="mt-2 text-xs text-slate-400">Aguardando resposta</div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">Plano atual</div>
            <div className="mt-3 text-3xl font-semibold text-white">Mensal</div>
            <div className="mt-2 text-xs text-slate-400">Válido até 15/11</div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <QueriesPanel />

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Avisos do sistema</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-sm font-medium text-white">Provider em modo simulado</div>
                <div className="mt-2 text-sm text-slate-300">O transporte de demonstração está ativo. Nenhum dado real é consultado.</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-sm font-medium text-white">Créditos configurados</div>
                <div className="mt-2 text-sm text-slate-300">O saldo e os registros de transação foram preparados para auditoria e extensões futuras.</div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
