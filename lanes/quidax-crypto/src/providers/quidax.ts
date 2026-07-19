/**
 * Live Quidax adapter. Uses Quidax's FREE, KEYLESS public market-data API for Nigerian
 * crypto tickers (BTC/NGN etc.). Read-only public market data — no PII, no key, no trading.
 *
 * Endpoints VERIFIED by live probe (2026-07-15) against app.quidax.io:
 *   GET https://app.quidax.io/api/v1/markets/tickers/{market}
 *     -> { "status": "success", "message": "Successful",
 *          "data": { "at": 1784144760, "ticker": { "buy": "90389440.0", "sell": "90873026.0",
 *                    "low": "89489016.0", "high": "91686674.0", "open": "89733394.0",
 *                    "last": "90691052.0", "vol": "0.57144386" }, "market": "btcngn" } }
 *   GET https://app.quidax.io/api/v1/markets/tickers
 *     -> { "status": "success", "message": "Successful",
 *          "data": { "<market>": { "at": <unix seconds>, "ticker": { ...same fields } }, ... } }
 *        (data is an OBJECT keyed by market name — btcngn, ethngn, usdtngn, 90+ pairs)
 *
 * Gotchas baked in below: every price/volume arrives as a STRING (parse with Number());
 * "at" is unix SECONDS (number); the list entries carry no explicit base/quote split, so
 * base/quote are derived from the market key by known quote suffixes.
 */
import { fetchJson, stamp, notFound, ToolError } from "@braynexservices/nigeria-mcp-core";
import {
  type CryptoProvider,
  type NormalizedCryptoTicker,
  type NormalizedCryptoMarket,
} from "../schema.js";

const BASE_URL = "https://app.quidax.io/api/v1";
const FETCH_TIMEOUT_MS = 15_000;

/** Quote currencies observed in the live market list, longest first so "usdt" wins over "usd". */
const KNOWN_QUOTES = ["usdt", "ngn", "usd", "ghs", "btc"];

interface QuidaxTicker {
  buy?: string;
  sell?: string;
  low?: string;
  high?: string;
  open?: string;
  last?: string;
  vol?: string;
}

interface QuidaxTickerEntry {
  at?: number;
  ticker?: QuidaxTicker;
  market?: string;
}

interface QuidaxSingleResponse {
  status?: string;
  message?: string;
  data?: QuidaxTickerEntry;
}

interface QuidaxListResponse {
  status?: string;
  message?: string;
  data?: Record<string, QuidaxTickerEntry>;
}

/** Quidax encodes numbers as strings ("90691052.0") — parse, or null when absent/garbled. */
function num(value: string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Quidax "at" is unix seconds; normalize to ISO-8601 (fall back to now if absent/absurd). */
function toIso(at: number | undefined): string {
  // Bound to a sane epoch-seconds range (0 .. year 2100). A finite but absurd value would make
  // at*1000 exceed the JS Date range (±8.64e15 ms) and throw RangeError; realistic "at" is ~1.7e9.
  if (typeof at === "number" && Number.isFinite(at) && at > 0 && at < 4_102_444_800) {
    return new Date(at * 1000).toISOString();
  }
  return new Date().toISOString();
}

/** Derive base/quote from a market key like "btcngn" via known quote suffixes. */
function splitMarket(market: string): { base: string; quote: string } {
  for (const q of KNOWN_QUOTES) {
    if (market.endsWith(q) && market.length > q.length) {
      return { base: market.slice(0, -q.length).toUpperCase(), quote: q.toUpperCase() };
    }
  }
  // Unknown suffix — best effort: treat the last 3 chars as the quote currency.
  return { base: market.slice(0, -3).toUpperCase(), quote: market.slice(-3).toUpperCase() };
}

export class QuidaxCryptoProvider implements CryptoProvider {
  readonly name = "quidax";

  async getTicker(market: string): Promise<NormalizedCryptoTicker> {
    const key = market.trim().toLowerCase();
    const { res, body: raw } = await fetchJson(
      `${BASE_URL}/markets/tickers/${encodeURIComponent(key)}`,
      { headers: { Accept: "application/json" } },
      { service: "Quidax", fallbackHint: "set CRYPTO_PROVIDER=mock", timeoutMs: FETCH_TIMEOUT_MS },
    );
    if (res.status === 404) {
      notFound(
        `Market ${key} on Quidax`,
        "Call list_crypto_markets for valid pairs, or set CRYPTO_PROVIDER=mock.",
      );
    }
    if (!res.ok) {
      throw new ToolError(
        `Quidax request failed (HTTP ${res.status}).`,
        "Retry shortly, or set CRYPTO_PROVIDER=mock.",
      );
    }
    if (raw === null) {
      throw new ToolError(
        "Quidax returned a malformed (non-JSON) response.",
        "Retry shortly, or set CRYPTO_PROVIDER=mock.",
      );
    }
    const body = raw as QuidaxSingleResponse;
    const ticker = body.data?.ticker;
    const last = num(ticker?.last);
    if (body.status !== "success" || !ticker || last === null) {
      // Unknown pairs can come back as a non-success envelope rather than an HTTP 404.
      notFound(
        `Market ${key} on Quidax`,
        "Call list_crypto_markets for valid pairs, or set CRYPTO_PROVIDER=mock.",
      );
    }
    const marketKey = body.data?.market ?? key;
    const { base, quote } = splitMarket(marketKey);
    return stamp(
      {
        market: marketKey,
        base,
        quote,
        last,
        high: num(ticker.high),
        low: num(ticker.low),
        volume: num(ticker.vol),
        at: toIso(body.data?.at),
      },
      this.name,
    );
  }

  async listMarkets(): Promise<NormalizedCryptoMarket[]> {
    const { res, body: raw } = await fetchJson(
      `${BASE_URL}/markets/tickers`,
      { headers: { Accept: "application/json" } },
      { service: "Quidax", fallbackHint: "set CRYPTO_PROVIDER=mock", timeoutMs: FETCH_TIMEOUT_MS },
    );
    if (!res.ok) {
      throw new ToolError(
        `Quidax request failed (HTTP ${res.status}).`,
        "Retry shortly, or set CRYPTO_PROVIDER=mock.",
      );
    }
    const body = raw as QuidaxListResponse | null;
    if (!body || body.status !== "success" || !body.data || typeof body.data !== "object") {
      throw new ToolError(
        "Quidax returned a malformed market list.",
        "Retry shortly, or set CRYPTO_PROVIDER=mock.",
      );
    }
    return Object.keys(body.data)
      .sort()
      .map((m) => ({ market: m, ...splitMarket(m) }));
  }
}
