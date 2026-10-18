import { dashboardCards, recentHistory, systemAlerts } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Olá, Ana</h1>
          </div>
          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Status: operacional</div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="text-sm text-slate-400">{item.label}</div>
              <div className="mt-3 text-3xl font-semibold text-white">{item.value}</div>
              <div className="mt-2 text-xs text-slate-400">{item.meta}</div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Histórico recente</h2>
              <button className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200">Filtrar</button>
            </div>
            <div className="space-y-4">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <div className="font-medium text-white">{entry.title}</div>
                    <div className="text-sm text-slate-400">{entry.date}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${entry.status === 'Concluída' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Avisos do sistema</h2>
            <div className="mt-5 space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="text-sm font-medium text-white">{alert.title}</div>
                  <div className="mt-2 text-sm text-slate-300">{alert.message}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
