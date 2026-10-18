export async function GET() {
  return Response.json({
    ok: true,
    balance: 18,
    available: 18,
    transactions: [
      { id: 'txn_101', date: '2026-10-18', type: 'purchase', amount: 30, reference: 'pkg-3', note: 'Crédito comprado' },
      { id: 'txn_102', date: '2026-10-18', type: 'consumed', amount: -2, reference: 'query_abc', note: 'Consulta CPF' },
      { id: 'txn_103', date: '2026-10-17', type: 'promotional', amount: 5, reference: 'promo-01', note: 'Bônus de demonstração' },
    ],
  });
}
