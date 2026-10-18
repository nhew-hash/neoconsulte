import { getAuthUser, json } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return json({ ok: true, user: null });

  return json({ ok: true, user: { email: user.email, role: user.role, name: user.name } });
}
