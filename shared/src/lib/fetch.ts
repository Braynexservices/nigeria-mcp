/**
 * Shared fetch-with-retry used by every live adapter. Applies a per-attempt timeout and
 * backoff-retry on TRANSIENT failures — network/timeout rejections, HTTP 429, and 5xx.
 * (Hand-rolled retry loops in each adapter used to let a fetch() rejection escape unretried;
 * centralizing it fixes that once.)
 *
 * Non-retryable responses are returned to the caller as { res, body } so each adapter keeps
 * its own status/body policy — e.g. treat 401/403 as an auth error, or trust a provider's
 * JSON envelope on a benign 4xx. Throws a ToolError only when all attempts are exhausted.
 */
import { ToolError } from "./errors.js";

export interface FetchJsonOptions {
  /** Human label for error messages, e.g. "Paystack". */
  service: string;
  /** Actionable tail appended to transient hints, e.g. "set BANK_PROVIDER=mock". */
  fallbackHint: string;
  /** Per-attempt timeout in ms. Default 15s. */
  timeoutMs?: number;
  /** Backoff (ms) before each attempt; first entry is usually 0. Default [0, 600, 1500]. */
  backoffsMs?: number[];
}

export interface FetchJsonResult {
  res: Response;
  /** Parsed JSON body, or null if the response was not valid JSON. */
  body: unknown;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function fetchJson(
  url: string,
  init: RequestInit,
  opts: FetchJsonOptions,
): Promise<FetchJsonResult> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const backoffs = opts.backoffsMs ?? [0, 600, 1500];

  let lastError: ToolError | null = null;
  for (const backoff of backoffs) {
    // Jitter so many clients retrying the same provider don't synchronize (AWS backoff guidance).
    if (backoff) await sleep(backoff + Math.floor(Math.random() * 250));
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      // Timeout / DNS / connection reset — a transient we should retry, not leak raw.
      lastError = new ToolError(
        `${opts.service} did not respond (network error or timeout).`,
        `Retried; try again shortly, or ${opts.fallbackHint}.`,
      );
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      lastError = new ToolError(
        `${opts.service} is rate-limited or unavailable (HTTP ${res.status}).`,
        `Retried; try again shortly, or ${opts.fallbackHint}.`,
      );
      continue;
    }
    const body = await res.json().catch(() => null);
    return { res, body };
  }
  throw (
    lastError ??
    new ToolError(
      `${opts.service} request failed after retries.`,
      `Try again shortly, or ${opts.fallbackHint}.`,
    )
  );
}
