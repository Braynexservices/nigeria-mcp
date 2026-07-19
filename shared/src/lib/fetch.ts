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
  /** Hard cap on the response body we will buffer, in bytes. Default 8 MiB. */
  maxBytes?: number;
}

export interface FetchJsonResult {
  res: Response;
  /** Parsed JSON body, or null if the response was not valid JSON or exceeded maxBytes. */
  body: unknown;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB — every provider we hit returns far less.

/**
 * Read a response body with a hard byte ceiling so a compromised/misbehaving upstream can't
 * exhaust memory (res.json() buffers unboundedly). Returns the decoded text, or null if the
 * body is absent or exceeds the cap — the caller then treats null as an unparseable body,
 * i.e. fails closed rather than trusting a truncated payload.
 */
async function readCapped(res: Response, maxBytes: number): Promise<string | null> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null; // reject early when advertised
  if (!res.body) {
    const text = await res.text();
    return text.length > maxBytes ? null : text;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export async function fetchJson(
  url: string,
  init: RequestInit,
  opts: FetchJsonOptions,
): Promise<FetchJsonResult> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const backoffs = opts.backoffsMs ?? [0, 600, 1500];
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;

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
    const text = await readCapped(res, maxBytes).catch(() => null);
    let body: unknown = null;
    if (text !== null && text !== "") {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
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
