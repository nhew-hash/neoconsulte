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
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">Pagamentos pendentes</div><div className="mt-3 text-3xl font-semibold text-white">4</div><div className="mt-2 text-xs text-slate-400">Em validação</div></div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">Taxa de falhas</div><div className="mt-3 text-3xl font-semibold text-white">2%</div><div className="mt-2 text-xs text-slate-400">Provider mock</div></div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Status dos providers</h2>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200">Atualizar</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Tentativas</th>
                  <th className="pb-3">Último evento</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-800">
                  <td className="py-4 font-medium text-white">Telegram</td>
                  <td className="py-4"><span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">Em revisão</span></td>
                  <td className="py-4">7</td>
                  <td className="py-4">2 min atrás</td>
                </tr>
                <tr className="border-t border-slate-800">
                  <td className="py-4 font-medium text-white">Mock</td>
                  <td className="py-4"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Operacional</span></td>
                  <td className="py-4">3</td>
                  <td className="py-4">5 min atrás</td>
                </tr>
              </tbody>
            </table>
          </div>
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
