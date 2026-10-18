import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-50">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-xl font-bold text-slate-950">N</div>
          <h1 className="mt-4 text-2xl font-semibold">Criar conta</h1>
          <p className="mt-2 text-sm text-slate-400">Acesso ao cliente e painel administrativo</p>
        </div>

        <form className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-slate-300 md:col-span-2">
            <span className="mb-2 block">Nome completo</span>
            <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" defaultValue="Ana Costa" />
          </label>
          <label className="block text-sm text-slate-300 md:col-span-2">
            <span className="mb-2 block">E-mail</span>
            <input type="email" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" defaultValue="ana@neoconsulte.demo" />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Senha</span>
            <input type="password" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" defaultValue="demo123" />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Cargo</span>
            <select className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400">
              <option>customer</option>
              <option>admin</option>
              <option>support</option>
            </select>
          </label>
          <button type="button" className="md:col-span-2 w-full rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950">Registrar conta</button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Já possui conta? <Link href="/login" className="text-teal-300">Entrar</Link>
        </div>
      </div>
    </main>
  );
}
