'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const payload = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(payload.error ?? 'Erro ao criar conta');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-50">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-xl font-bold text-slate-950">N</div>
          <h1 className="mt-4 text-2xl font-semibold">Criar conta</h1>
          <p className="mt-2 text-sm text-slate-400">Acesso ao cliente e painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm text-slate-300 md:col-span-2">
            <span className="mb-2 block">Nome completo</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" />
          </label>
          <label className="block text-sm text-slate-300 md:col-span-2">
            <span className="mb-2 block">E-mail</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" />
          </label>
          <label className="block text-sm text-slate-300 md:col-span-2">
            <span className="mb-2 block">Senha</span>
            <input type="password" minLength={8} autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-400" />
          </label>
          {error ? <p className="md:col-span-2 text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading} type="submit" className="md:col-span-2 w-full rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{loading ? 'Criando conta...' : 'Registrar conta'}</button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Já possui conta? <a href="/login" className="text-teal-300">Entrar</a>
        </div>
      </div>
    </main>
  );
}
