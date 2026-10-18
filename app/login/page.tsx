import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-xl font-bold text-slate-950">N</div>
          <h1 className="mt-4 text-2xl font-semibold">Entrar</h1>
          <p className="mt-2 text-sm text-slate-400">Acesso ao painel do cliente</p>
        </div>

        <form className="space-y-5">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">E-mail</span>
            <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" defaultValue="cliente@neoconsulte.demo" />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Senha</span>
            <input type="password" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" defaultValue="demo123" />
          </label>
          <button type="button" className="w-full rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950">Acessar dashboard</button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <Link href="/signup" className="text-teal-300">Criar conta</Link>
          <Link href="/" className="text-slate-300">Voltar ao início</Link>
        </div>
      </div>
    </main>
  );
}
