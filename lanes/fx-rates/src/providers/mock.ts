/**
 * Mock FX provider — the default. Serves deterministic NGN rate fixtures (official +
 * parallel) so the lane runs with zero signup. Implements the core FxProvider interface;
 * swap via FX_PROVIDER env. */
import { type FxProvider, type FxRate, stamp } from "@braynexservices/nigeria-mcp-core";
import { RATES } from "../fixtures.js";

export class MockFxProvider implements FxProvider {
  readonly name = "mock";

  async rates(base = "NGN", quote?: string): Promise<FxRate[]> {
    const b = base.trim().toUpperCase();
    const q = quote?.trim().toUpperCase();
    return RATES.filter((r) => r.base === b && (!q || r.quote === q)).map((r) =>
      stamp({ base: r.base, quote: r.quote, rate: r.rate, market: r.market }, this.name),
    );
  }
}
