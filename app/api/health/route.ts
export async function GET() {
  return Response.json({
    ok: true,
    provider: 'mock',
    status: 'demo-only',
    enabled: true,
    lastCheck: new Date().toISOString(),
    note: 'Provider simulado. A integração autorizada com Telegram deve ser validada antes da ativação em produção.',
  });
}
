import { adminKPIs, adminTableRows } from '@/lib/mock-data';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Administração</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Painel administrativo</h1>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {adminKPIs.map((kpi) => (
            <div key={kpi.label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="text-sm text-slate-400">{kpi.label}</div>
              <div className="mt-3 text-3xl font-semibold text-white">{kpi.value}</div>
              <div className="mt-2 text-xs text-slate-400">{kpi.meta}</div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Status dos providers</h2>
            <button className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200">Atualizar</button>
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
                {adminTableRows.map((row) => (
                  <tr key={row.name} className="border-t border-slate-800">
                    <td className="py-4 font-medium text-white">{row.name}</td>
                    <td className="py-4"><span className={`rounded-full px-2 py-1 text-xs ${row.status === 'Operacional' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{row.status}</span></td>
                    <td className="py-4">{row.attempts}</td>
                    <td className="py-4">{row.lastEvent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
