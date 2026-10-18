'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type QueryItem = {
  id: string;
  category: string;
  maskedInput: string;
  status: 'WAITING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVIEW' | 'CANCELLED';
  costCredits: number;
  refunded: boolean;
  createdAt: string;
  error: string | null;
  result?: string;
};

const LABELS: Record<QueryItem['status'], string> = {
  WAITING: 'Aguardando',
  PROCESSING: 'Processando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
  REVIEW: 'Em revisão',
  CANCELLED: 'Cancelado',
};

const STYLES: Record<QueryItem['status'], string> = {
  WAITING: 'bg-slate-500/10 text-slate-300',
  PROCESSING: 'bg-amber-500/10 text-amber-300',
  COMPLETED: 'bg-emerald-500/10 text-emerald-300',
  FAILED: 'bg-rose-500/10 text-rose-300',
  REVIEW: 'bg-sky-500/10 text-sky-300',
  CANCELLED: 'bg-slate-500/10 text-slate-400',
};

const CATEGORIES = ['CPF', 'CNPJ', 'Nome', 'Telefone', 'Placa'];

export default function QueriesPanel() {
  const router = useRouter();
  const [items, setItems] = useState<QueryItem[]>([]);
  const [category, setCategory] = useState('CPF');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<QueryItem | null>(null);
  // Mesma chave enquanto a tentativa não for confirmada: reenvio por rede instável não cobra duas vezes.
  const keyRef = useRef<string>('');

  const load = useCallback(async () => {
    const res = await fetch('/api/queries', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.queries);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = items.some((i) => i.status === 'WAITING' || i.status === 'PROCESSING');

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      load();
      router.refresh(); // atualiza o saldo (estornos)
    }, 3000);
    return () => clearInterval(timer);
  }, [active, load, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    if (!keyRef.current) keyRef.current = crypto.randomUUID();

    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': keyRef.current },
        body: JSON.stringify({ category, input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível enviar');
        if (res.status < 500) keyRef.current = ''; // erro definitivo: próxima tentativa é nova solicitação
        return;
      }
      keyRef.current = '';
      setInput('');
      await load();
      router.refresh();
    } catch {
      setError('Falha de rede. Tente novamente (não haverá cobrança duplicada).');
    } finally {
      setSubmitting(false);
    }
  }

  async function open(item: QueryItem) {
    const res = await fetch(`/api/queries/${item.id}`, { cache: 'no-store' });
    if (res.ok) setSelected((await res.json()).query);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
      <h2 className="text-xl font-semibold text-white">Nova consulta</h2>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
          minLength={3}
          placeholder="Valor da consulta"
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400"
        />
        <button disabled={submitting} className="rounded-2xl bg-teal-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
          {submitting ? 'Enviando...' : 'Consultar'}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

      <h3 className="mb-3 mt-8 text-lg font-semibold text-white">Histórico</h3>
      <div className="space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-400">Nenhuma consulta ainda.</p> : null}
        {items.map((item) => (
          <button key={item.id} onClick={() => open(item)} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left">
            <div>
              <div className="font-medium text-white">
                {item.category} · {item.maskedInput}
              </div>
              <div className="text-sm text-slate-400">
                {new Date(item.createdAt).toLocaleString('pt-BR')}
                {item.refunded ? ' · estornado' : ''}
              </div>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs ${STYLES[item.status]}`}>{LABELS[item.status]}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white">
              {selected.category} · {LABELS[selected.status]}
            </div>
            <button onClick={() => setSelected(null)} className="text-xs text-slate-400">
              Fechar
            </button>
          </div>
          {selected.result ? <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{selected.result}</pre> : null}
          {selected.error ? <p className="mt-3 text-sm text-rose-300">{selected.error}</p> : null}
          {!selected.result && !selected.error ? <p className="mt-3 text-sm text-slate-400">Ainda sem resultado.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
