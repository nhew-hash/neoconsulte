import { getAuthUser, json } from '@/lib/auth';
import { getQueryForUser } from '@/lib/queue/service';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request);
  if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);

  // filtra por userId: consulta de outro usuário responde 404, nunca 403 (não revela existência)
  const query = await getQueryForUser(user.id, params.id);
  if (!query) return json({ ok: false, error: 'Não encontrada' }, 404);

  return json({ ok: true, query }, 200, { 'Cache-Control': 'no-store' });
}
