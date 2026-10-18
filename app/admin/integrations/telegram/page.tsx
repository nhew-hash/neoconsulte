'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type TelegramState = {
  status: 'disconnected' | 'waiting_auth' | 'connected' | 'error' | 'expired';
  message: string;
  events: any[];
  expiresAt?: string | null;
  qrCode?: string | null;
};

export default function TelegramIntegrationPage() {
  const [state, setState] = useState<TelegramState>({
    status: 'disconnected',
    message: 'Carregando integração do Telegram…',
    events: [],
    expiresAt: null,
    qrCode: null,
  });

  const refreshState = async () => {
    const response = await fetch('/api/admin/telegram/status', { cache: 'no-store' });
    const payload = await response.json();
    if (payload.ok) {
      setState(payload.state);
    }
  };

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusMap = {
    disconnected: 'bg-slate-700 text-slate-200',
    waiting_auth: 'bg-amber-500/10 text-amber-300',
    connected: 'bg-emerald-500/10 text-emerald-300',
    error: 'bg-red-500/10 text-red-300',
    expired: 'bg-orange-500/10 text-orange-300',
  } as const;

  const statusKey = (state.status ?? 'disconnected') as keyof typeof statusMap;
  const statusClass = statusMap[statusKey];

  const action = async (path: string, payload?: Record<string, string>) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const result = await response.json();
    if (result.ok) {
      setState(result.state ?? result);
      await refreshState();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Configurações</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Integrações · Telegram</h1>
          </div>
          <Link href="/admin" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100">
            Voltar ao painel
          </Link>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Status da integração</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                {state.status ?? 'disconnected'}
              </span>
            </div>

            <p className="mt-4 text-slate-300">{state.message ?? 'Sem mensagem disponível.'}</p>

            {state.expiresAt ? (
              <p className="mt-3 text-sm text-slate-400">
                QR expira em: {new Date(state.expiresAt).toLocaleString('pt-BR')}
              </p>
            ) : null}

            {state.qrCode ? (
              <div className="mt-6 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <img src={state.qrCode} alt="QR Code do Telegram" className="h-56 w-56 rounded-xl bg-white p-3" />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-sm text-slate-400">
                Nenhum QR Code ativo no momento.
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => action('/api/admin/telegram/connect')}
                className="rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Iniciar conexão
              </button>
              <button
                onClick={() => action('/api/admin/telegram/approve')}
                className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm text-emerald-200"
              >
                Validar sessão demo
              </button>
              <button
                onClick={() => action('/api/admin/telegram/test', { message: 'Teste de integração Telegram' })}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100"
              >
                Enviar mensagem de teste
              </button>
              <button
                onClick={() => action('/api/admin/telegram/disconnect')}
                className="rounded-full border border-red-400/40 px-4 py-2 text-sm text-red-200"
              >
                Desconectar
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white">Avisos de segurança</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              <li>• O QR Code e a sessão ficam no backend.</li>
              <li>• Nenhum token, arquivo de sessão ou segredo é exposto ao frontend.</li>
              <li>• A integração atual permanece em modo demonstrativo até validação do cliente autorizado.</li>
              <li>• O adaptador foi montado para trocar o provider sem afetar a aplicação principal.</li>
            </ul>
          </aside>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white">Eventos recentes</h2>
          <div className="mt-5 space-y-3">
            {(state.events ?? []).slice(0, 8).map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>{event.direction}</span>
                  <span>{new Date(event.receivedAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="mt-2 text-sm text-slate-200">{event.text}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
