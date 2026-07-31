export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
  isRetryable?: (e: unknown) => boolean;
};

const DEFAULT_RETRYABLE = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  const code = (e as { code?: string })?.code || "";
  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    code === "P2024" ||
    /can't reach database/i.test(msg) ||
    /timed out/i.test(msg) ||
    /ECONNRESET/i.test(msg) ||
    /ETIMEDOUT/i.test(msg) ||
    /connection pool/i.test(msg)
  );
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function backoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
) {
  const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(250, exp * 0.2));
  return exp + jitter;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const retries = opts.retries ?? 4;
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  const label = opts.label ?? "operation";
  const isRetryable = opts.isRetryable ?? DEFAULT_RETRYABLE;

  let last: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isRetryable(e) || attempt === retries) break;
      const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs);
      console.warn(
        `[retry] ${label} attempt ${attempt}/${retries} wait ${delay}ms:`,
        e instanceof Error ? e.message : e
      );
      await sleep(delay);
    }
  }
  throw last;
}
