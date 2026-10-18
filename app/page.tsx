import Link from 'next/link';

const pricing = [
  { name: 'Consulta avulsa', price: 'R$ 30', description: 'Pagamento simples para uso pontual.' },
  { name: 'Pacote de 3', price: 'R$ 70', description: 'Mais eficiência para uso recorrente.' },
  { name: 'Plano mensal', price: 'R$ 150', description: 'Renovação e controle de créditos configuráveis.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-lg font-bold text-slate-950">N</div>
          <div>
            <div className="text-lg font-semibold">NeoConsulte</div>
            <div className="text-xs text-slate-400">SaaS de consultas</div>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <Link href="#sobre">Sobre</Link>
          <Link href="#como-funciona">Como funciona</Link>
          <Link href="#planos">Planos</Link>
          <Link href="#faq">FAQ</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100">Entrar</Link>
          <Link href="/signup" className="rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Começar</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">Painel seguro · provider desacoplado · demo mode</p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Plataforma de consultas com segurança, transparência e escalabilidade.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            O NeoConsulte oferece gestão de consultas, créditos, histórico e painel administrativo com arquitetura preparada para integraç��o autorizada e provider real.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/signup" className="rounded-full bg-teal-400 px-6 py-3 font-semibold text-slate-950">Solicitar acesso</Link>
            <Link href="/dashboard" className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white">Ver demonstração</Link>
          </div>
          <div className="mt-10 grid max-w-lg gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-semibold text-white">3</div><div className="mt-2">módulos prontos</div></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-semibold text-white">24/7</div><div className="mt-2">monitoramento</div></div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><div className="text-2xl font-semibold text-white">100%</div><div className="mt-2">demonstrativo</div></div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-soft">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Visão geral</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Dashboard demo</h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Conectado</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900 p-4">
                <div className="flex items-center justify-between text-sm text-slate-400"><span>Saldo de créditos</span><span>Hoje</span></div>
                <div className="mt-3 text-3xl font-semibold text-white">18</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-900 p-4"><div className="text-sm text-slate-400">Consultas</div><div className="mt-2 text-2xl font-semibold text-white">14</div></div>
                <div className="rounded-2xl bg-slate-900 p-4"><div className="text-sm text-slate-400">Falhas</div><div className="mt-2 text-2xl font-semibold text-white">2%</div></div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex justify-between text-sm text-slate-300"><span>Provider</span><span className="text-teal-300">Mock</span></div>
                <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-full w-[78%] rounded-full bg-gradient-to-r from-teal-400 to-cyan-500" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-teal-300">Produto</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Estrutura organizada para evoluir sem reconstrução</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['Provider desacoplado', 'Acesso seguro via backend, com abstração de integrações e provider mock para testes.'],
            ['Créditos e auditoria', 'Ledger de transações com proteção contra consumo indevido e rastreio de alterações.'],
            ['Painel administrativo', 'Métricas, ajustes de crédito e status de integrações com logs de auditoria.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500" />
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-teal-300">Preços</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Estrutura de planos configurável</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pricing.map((plan) => (
            <div key={plan.name} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{plan.name}</p>
              <div className="mt-4 text-4xl font-semibold text-white">{plan.price}</div>
              <p className="mt-4 text-slate-300">{plan.description}</p>
              <Link href="/signup" className="mt-6 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-white">Escolher</Link>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-teal-300">FAQ</p>
          <div className="mt-6 space-y-4 text-slate-300">
            <div><strong className="text-white">É um produto real ou apenas mock?</strong><p className="mt-2">Este repositório entrega uma base operacional de SaaS com provider simulado, estruturas de dados e fluxos de crédito/consulta claros. A integração autenticada com Telegram ou fornecedor externo fica em etapa futura e necessita autorização.</p></div>
            <div><strong className="text-white">Como são tratados créditos?</strong><p className="mt-2">O sistema usa um ledger financeiro com transações e proteção de saldo negativo, sem confiar no frontend para validar cobrança.</p></div>
            <div><strong className="text-white">O painel administrativo está funcionando?</strong><p className="mt-2">Há uma base administrativa pronta para métricas e ajustes, includindo logs e gerenciamento de status.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
