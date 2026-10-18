export const QUERY_COST_CREDITS = 2;
export const MAX_SEND_ATTEMPTS = 3;

export function queryTimeoutMs() {
  const seconds = Number(process.env.QUERY_TIMEOUT_SECONDS ?? 120);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 120) * 1000;
}

export function backoffMs(attempt: number) {
  return Math.min(60_000, 2_000 * 2 ** Math.max(0, attempt - 1));
}
