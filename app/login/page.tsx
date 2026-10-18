'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(payload.error ?? 'Credenciais inválidas');
      return;
    }

    router.push(payload.redirect ?? '/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-xl font-bold text-slate-950">N</div>
          <h1 className="mt-4 text-2xl font-semibold">Entrar</h1>
          <p className="mt-2 text-sm text-slate-400">Acesso ao painel do cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">E-mail</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Senha</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" />
          </label>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading} type="submit" className="w-full rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{loading ? 'Entrando...' : 'Acessar dashboard'}</button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <a href="/signup" className="text-teal-300">Criar conta</a>
          <a href="/" className="text-slate-300">Voltar ao início</a>
        </div>
      </div>
    </main>
  );
}
