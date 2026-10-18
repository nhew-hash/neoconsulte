export const dashboardCards = [
  { label: 'Saldo de créditos', value: '18', meta: 'Disponível' },
  { label: 'Consultas no período', value: '14', meta: 'Últimos 30 dias' },
  { label: 'Solicitações em processamento', value: '3', meta: 'Aguardando resposta' },
  { label: 'Plano atual', value: 'Mensal', meta: 'Válido até 15/11' },
];

export const recentHistory = [
  { id: 'r1', title: 'Consulta de CPF', date: '18/10/2026 · 14:15', status: 'Concluída' },
  { id: 'r2', title: 'Consulta de Placa', date: '17/10/2026 · 12:00', status: 'Em processamento' },
  { id: 'r3', title: 'Consulta de Nome', date: '16/10/2026 · 09:03', status: 'Concluída' },
];

export const systemAlerts = [
  { title: 'Provider em modo simulado', message: 'O provedor de demonstração está ativo e não representa um canal real do Telegram.' },
  { title: 'Créditos configurados', message: 'O saldo e os logs de transação foram preparados para auditoria e extensões futuras.' },
];

export const adminKPIs = [
  { label: 'Receita confirmada', value: 'R$ 2.300', meta: 'Últimos 30 dias' },
  { label: 'Pagamentos pendentes', value: '4', meta: 'Em validação' },
  { label: 'Consultas por status', value: '18', meta: 'Ciclo atual' },
  { label: 'Taxa de falhas', value: '2%', meta: 'Provider mock' },
];

export const adminTableRows = [
  { name: 'Telegram provider', status: 'Operacional', attempts: '7', lastEvent: '2 min atrás' },
  { name: 'Mock provider', status: 'Em manutenção', attempts: '3', lastEvent: '5 min atrás' },
  { name: 'Gateway de pagamentos', status: 'Operacional', attempts: '4', lastEvent: '12 min atrás' },
];
