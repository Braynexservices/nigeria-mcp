/**
 * Live free-FX adapter. Uses open.er-api.com — a FREE, KEYLESS FX API — for Naira rates vs
 * major currencies. Returns the market/interbank mid-rate, which post-2023 float is the
 * de-facto official (NAFEM/NFEM) window. The parallel ("aboki") rate needs a different
 * source and is NOT available here (stays mock / future paid tier).
 *
 * Each FxRate means: 1 {quote} = {rate} {base} (base = NGN). Public market data, no PII, no key.
 */
import { type FxProvider, type FxRate, MemoryCache, fetchJson, stamp, notFound, ToolError } from "@braynexservices/nigeria-mcp-core";

const API_URL = "https://open.er-api.com/v6/latest/USD";
const DEFAULT_QUOTES = ["USD", "EUR", "GBP"];
const FETCH_TIMEOUT_MS = 15_000;
// open.er-api refreshes ~daily; a 1h cache keeps rates fresh while cutting calls + throttling.
const RATES_TTL_S = 3600;

interface ErApiResponse {
  result?: string;
  rates?: Record<string, number>;
}

export class FreeFxProvider implements FxProvider {
  readonly name = "free";
  /** Caches the upstream USD-base rate table (~1h) so repeat calls don't re-hit the API. */
  private readonly cache = new MemoryCache(RATES_TTL_S);

  /** Fetch (or reuse cached) USD-base rates from open.er-api.com. */
  private async usdRates(): Promise<Record<string, number>> {
    const cached = this.cache.get<Record<string, number>>("usd-rates");
    if (cached) return cached;

    const { res, body: raw } = await fetchJson(
      API_URL,
      { headers: { Accept: "application/json" } },
      { service: "Free FX source", fallbackHint: "set FX_PROVIDER=mock for offline rates", timeoutMs: FETCH_TIMEOUT_MS },
    );
    if (!res.ok) {
      throw new ToolError(
        `Free FX source request failed (HTTP ${res.status}).`,
        "Retry shortly, or set FX_PROVIDER=mock for offline rates.",
      );
    }
    if (raw === null) {
      throw new ToolError(
        "Free FX source returned a malformed (non-JSON) response.",
        "Retry shortly, or set FX_PROVIDER=mock.",
      );
    }
    const body = raw as ErApiResponse;
    if (body.result !== "success" || !body.rates || typeof body.rates.NGN !== "number") {
      throw new ToolError(
        "Free FX source returned no NGN rate.",
        "Retry shortly, or set FX_PROVIDER=mock.",
      );
    }
    this.cache.set("usd-rates", body.rates);
    return body.rates;
  }

  async rates(base = "NGN", quote?: string): Promise<FxRate[]> {
    // This lane is NGN-centric: only NGN-base pairs are produced (mirrors the mock).
    if (base.trim().toUpperCase() !== "NGN") return [];

    const usdRates = await this.usdRates();
    const ngnPerUsd = usdRates.NGN; // NGN per 1 USD
    const wanted = quote ? [quote.trim().toUpperCase()] : DEFAULT_QUOTES;
    const out: FxRate[] = [];
    for (const q of wanted) {
      if (q === "NGN") continue;
      const quotePerUsd = usdRates[q]; // units of quote per 1 USD
      if (typeof quotePerUsd !== "number" || quotePerUsd === 0) continue; // unknown currency
      const ngnPerQuote = ngnPerUsd / quotePerUsd; // NGN per 1 unit of quote
      out.push(
        stamp(
          { base: "NGN", quote: q, rate: Math.round(ngnPerQuote * 100) / 100, market: "official" as const },
          "open-er-api",
        ),
      );
    }

    if (quote && out.length === 0) {
      notFound(
        `FX rate NGN/${quote.trim().toUpperCase()}`,
        "That currency isn't covered by the free source. Try USD, EUR or GBP.",
      );
    }
    return out;
  }
}
