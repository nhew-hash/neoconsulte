import { getAuthUser, json } from '@/lib/auth';
import { resolveReviewAsFailed } from '@/lib/queue/service';

// Encerra como falha (com estorno único) uma consulta que ficou em REVIEW.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthUser(request);
  if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);
  if (user.role !== 'ADMIN') return json({ ok: false, error: 'Acesso negado' }, 403);

  const done = await resolveReviewAsFailed(params.id);
  if (!done) return json({ ok: false, error: 'Consulta não está em revisão' }, 409);
  return json({ ok: true });
}
