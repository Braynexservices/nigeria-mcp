/**
 * Mock crypto provider — the default. Resolves market tickers against deterministic
 * fixtures so the lane runs with zero signup. Swap via CRYPTO_PROVIDER env.
 *
 * Public market data only — no PII.
 */
import { stamp, notFound, nowIso } from "@braynexservices/nigeria-mcp-core";
import {
  type CryptoProvider,
  type NormalizedCryptoTicker,
  type NormalizedCryptoMarket,
} from "../schema.js";
import { TICKERS } from "../fixtures.js";

export class MockCryptoProvider implements CryptoProvider {
  readonly name = "mock";

  async getTicker(market: string): Promise<NormalizedCryptoTicker> {
    const key = market.trim().toLowerCase();
    const rec = TICKERS.find((t) => t.market === key);
    if (!rec) {
      notFound(
        `Market ${key}`,
        `Mock data covers: ${TICKERS.map((t) => t.market).join(", ")}. ` +
          "Set CRYPTO_PROVIDER=quidax for the full live market list.",
      );
    }
    return stamp(
      {
        market: rec.market,
        base: rec.base,
        quote: rec.quote,
        last: rec.last,
        high: rec.high ?? null,
        low: rec.low ?? null,
        volume: rec.volume ?? null,
        at: nowIso(), // prices are deterministic; the snapshot time is "now"
      },
      this.name,
    );
  }

  async listMarkets(): Promise<NormalizedCryptoMarket[]> {
    return TICKERS.map(({ market, base, quote }) => ({ market, base, quote }));
  }
}
