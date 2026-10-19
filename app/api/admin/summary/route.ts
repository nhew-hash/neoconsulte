export const dynamic = 'force-dynamic';
export const fetchCache = 'no-store';

import { prisma } from '@/lib/db';

export async function GET() {
  // If DATABASE_URL is not configured (e.g., during a preview build without a DB),
  // return a safe fallback so the build doesn't fail.
  if (!process.env.DATABASE_URL) {
    return Response.json({
      ok: true,
      summary: {
        users: 0,
        queries: 0,
        accounts: [],
      },
      warning: 'DATABASE_URL not set - returning empty summary for build.',
    });
  }

  try {
    const users = await prisma.user.count();
    const queries = await prisma.queryRequest.count();
    const accounts = await prisma.creditAccount.findMany({ orderBy: { balance: 'desc' }, take: 5 });

    return Response.json({
      ok: true,
      summary: {
        users,
        queries,
        accounts: accounts.map((a) => ({ userId: a.userId, balance: a.balance })),
      },
    });
  } catch (err) {
    // If any runtime error occurs (e.g., DB unreachable), return a safe response
    return Response.json({ ok: false, error: String(err) });
  }
}
