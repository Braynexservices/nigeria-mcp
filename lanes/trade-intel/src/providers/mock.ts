/**
 * Mock trade provider — the default. Serves deterministic Nigeria trade flows + a tiny
 * HS-code classifier so the lane runs with zero signup. Implements the core TradeProvider
 * interface; swap via TRADE_PROVIDER env. Public macro data — no PII, safe to cache later.
 */
import {
  type TradeProvider,
  type TradeStatsQuery,
  type NormalizedTradeFlow,
  type NormalizedHsCode,
  stamp,
  notFound,
} from "@braynexservices/nigeria-mcp-core";
import { TRADE_FLOWS } from "../fixtures.js";
import { classifyHsLocal } from "../classify.js";

const COMMODITY_LEVELS = new Set(["total", "chapters", "headings", "detailed", "all"]);

export class MockTradeProvider implements TradeProvider {
  readonly name = "mock";

  async tradeStats(query: TradeStatsQuery): Promise<NormalizedTradeFlow[]> {
    const f = query.flow.trim().toLowerCase();
    const p = query.partner?.trim().toLowerCase();
    // commodity may be an aggregation level (no filtering) or a specific HS code (exact filter).
    const rawCommodity = query.commodity?.trim();
    const hs = rawCommodity && !COMMODITY_LEVELS.has(rawCommodity.toLowerCase()) ? rawCommodity : undefined;
    const year = query.year;
    return TRADE_FLOWS.filter(
      (t) =>
        t.flow === f &&
        (!p || t.partner.toLowerCase() === p) &&
        (!hs || t.hsCode === hs) &&
        (year === undefined || t.year === year),
    )
      .map((t) =>
        stamp(
          {
            reporter: t.reporter,
            partner: t.partner,
            hsCode: t.hsCode,
            commodity: t.commodity,
            flow: t.flow,
            period: String(t.year),
            year: t.year,
            valueUsd: t.valueUsd,
            cifValueUsd: t.flow === "import" ? t.valueUsd : null,
            fobValueUsd: t.flow === "export" ? t.valueUsd : null,
            netWeightKg: t.netWeightKg ?? null,
            quantity: t.quantity ?? null,
            quantityUnit: t.quantityUnit ?? null,
          },
          this.name,
        ),
      )
      .sort((a, b) => b.valueUsd - a.valueUsd);
  }

  async classifyHs(productDescription: string): Promise<NormalizedHsCode> {
    const match = classifyHsLocal(productDescription);
    if (!match) {
      notFound(
        `HS classification for "${productDescription}"`,
        "Try a simpler product keyword (e.g. 'rice', 'crude oil', 'phone'); the mock classifier covers common goods.",
      );
    }
    return stamp({ query: productDescription, hsCode: match.hsCode, heading: match.heading }, this.name);
  }
}
