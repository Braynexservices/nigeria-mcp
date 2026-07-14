/**
 * Live open-data trade adapter. Trade stats come from UN Comtrade's FREE, keyless "preview"
 * endpoint; partner + commodity codes are resolved via Comtrade's OWN reference tables (so
 * names are authoritative, not guessed). HS classification reuses the free local heuristic
 * (a commercial classifier — Avalara/Zonos — is the paid upgrade). Public macro data, no PII.
 *
 * Capabilities: annual OR monthly; commodity by specific HS code OR a breakdown level
 * (total/chapters/headings/detailed); value (primary + CIF/FOB), net weight + quantity where
 * reported. Reporter is always Nigeria (566). Annual data lags ~1–2 years.
 *
 * Limits: preview tier caps at 500 records/call (broad breakdowns are truncated to the top
 * by value). Do NOT wrap Nigeria Customs NICIS II — open global APIs only.
 */
import {
  type TradeProvider,
  type TradeStatsQuery,
  type NormalizedTradeFlow,
  type NormalizedHsCode,
  MemoryCache,
  fetchJson,
  stamp,
  notFound,
  ToolError,
} from "@braynexservices/nigeria-mcp-core";
import { classifyHsLocal, hsLabel } from "../classify.js";

const PREVIEW_BASE = "https://comtradeapi.un.org/public/v1/preview"; // + /C/{A|M}/HS
const PARTNER_REF_URL = "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json";
const HS_REF_URL = "https://comtradeapi.un.org/files/v1/app/reference/HS.json";
const NIGERIA_CODE = 566;
const DEFAULT_YEAR = 2023;
const FETCH_TIMEOUT_MS = 20_000;
// 3 attempts: immediate, then backoff on throttle (429) / transient server errors (5xx).
const RETRY_BACKOFFS_MS = [0, 800, 2000];
// Trade data changes rarely; a 6h per-query cache cuts calls + dodges rate limits.
const STATS_TTL_S = 21_600;
// Commodity aggregation levels (Comtrade cmdCode). A specific HS code is passed through as-is.
const COMMODITY_LEVELS: Record<string, string> = {
  total: "TOTAL",
  chapters: "AG2",
  headings: "AG4",
  detailed: "AG6",
  all: "AG2",
};

interface ComtradeRecord {
  partnerCode: number;
  cmdCode: string;
  period: string | number;
  refYear: number;
  flowCode: string;
  primaryValue: number | null;
  cifvalue: number | null;
  fobvalue: number | null;
  netWgt: number | null;
  qty: number | null;
  qtyUnitAbbr: string | null;
}

export class OpenDataTradeProvider implements TradeProvider {
  readonly name = "opendata";
  /** Comtrade reference tables, loaded once per process. */
  private partnerName?: Map<number, string>; // code -> display name
  private partnerKey?: Map<string, number>; // lowercased name / ISO2 / ISO3 / code -> code
  private hsRef?: Map<string, string>; // HS code -> description (undefined = not yet attempted)
  /** Caches successful per-query trade-stats results (~6h). */
  private readonly statsCache = new MemoryCache(STATS_TTL_S);

  private async getJson(url: string): Promise<unknown> {
    const { res, body } = await fetchJson(
      url,
      { headers: { Accept: "application/json" } },
      {
        service: "UN Comtrade",
        fallbackHint: "add a free Comtrade key for higher limits, or set TRADE_PROVIDER=mock",
        timeoutMs: FETCH_TIMEOUT_MS,
        backoffsMs: RETRY_BACKOFFS_MS,
      },
    );
    // 429/5xx and network/timeout are already retried inside fetchJson; fail fast on other 4xx.
    if (!res.ok) {
      throw new ToolError(
        `UN Comtrade request failed (HTTP ${res.status}).`,
        "Retry shortly, or set TRADE_PROVIDER=mock for offline data.",
      );
    }
    if (body === null) {
      throw new ToolError(
        "UN Comtrade returned a malformed (non-JSON) response.",
        "Retry shortly, or set TRADE_PROVIDER=mock for offline data.",
      );
    }
    return body;
  }

  /** Load reference tables: partners (required) + HS descriptions (best-effort). Independent URLs. */
  private async ensureRefs(): Promise<void> {
    await Promise.all([
      this.partnerName ? Promise.resolve() : this.ensurePartners(),
      this.hsRef === undefined ? this.ensureHsRef() : Promise.resolve(),
    ]);
  }

  private async ensurePartners(): Promise<void> {
    const body = (await this.getJson(PARTNER_REF_URL)) as { results?: unknown[] } | unknown[];
    const rows = (Array.isArray(body) ? body : (body.results ?? [])) as Array<Record<string, unknown>>;
    const name = new Map<number, string>();
    const key = new Map<string, number>();
    for (const r of rows) {
      const code = Number(r.PartnerCode ?? r.id);
      const desc = String(r.PartnerDesc ?? r.text ?? "").trim();
      if (!Number.isFinite(code) || !desc) continue;
      name.set(code, desc);
      // Some names/ISO codes map to >1 Comtrade area (e.g. "Switzerland" 756/757).
      // Resolve deterministically to the lower (canonical M49) code instead of last-write-wins.
      const addKey = (k: string) => {
        const existing = key.get(k);
        if (existing === undefined || code < existing) key.set(k, code);
      };
      addKey(desc.toLowerCase());
      addKey(String(code));
      if (r.PartnerCodeIsoAlpha3) addKey(String(r.PartnerCodeIsoAlpha3).toLowerCase());
      if (r.PartnerCodeIsoAlpha2) addKey(String(r.PartnerCodeIsoAlpha2).toLowerCase());
    }
    if (name.size === 0) {
      throw new ToolError(
        "UN Comtrade partner reference came back empty.",
        "Retry shortly, or set TRADE_PROVIDER=mock.",
      );
    }
    this.partnerName = name;
    this.partnerKey = key;
  }

  /** Best-effort: HS code -> description. On failure, leaves an empty map (we fall back to codes). */
  private async ensureHsRef(): Promise<void> {
    try {
      const body = (await this.getJson(HS_REF_URL)) as { results?: unknown[] } | unknown[];
      const rows = (Array.isArray(body) ? body : (body.results ?? [])) as Array<Record<string, unknown>>;
      const map = new Map<string, string>();
      for (const r of rows) {
        const id = String(r.id ?? r.cmdCode ?? "").trim();
        let text = String(r.text ?? r.cmdDesc ?? "").trim();
        const dash = text.indexOf(" - "); // "150510 - Wool grease, crude" -> "Wool grease, crude"
        if (dash > 0) text = text.slice(dash + 3).trim();
        if (id && text) map.set(id, text);
      }
      this.hsRef = map;
    } catch {
      this.hsRef = new Map(); // attempted; degrade to code labels rather than failing the query
    }
  }

  private commodityName(code: string): string {
    const desc = this.hsRef?.get(code);
    if (desc) return desc;
    if (code === "TOTAL") return "All commodities";
    return hsLabel(code);
  }

  private resolvePartner(partner: string): number {
    const code = this.partnerKey!.get(partner.trim().toLowerCase());
    if (code === undefined) {
      notFound(
        `Trade partner "${partner}"`,
        "Use a country name (e.g. China), ISO code (CHN/CN), or numeric Comtrade code — or omit partner for all partners.",
      );
    }
    return code;
  }

  async tradeStats(query: TradeStatsQuery): Promise<NormalizedTradeFlow[]> {
    await this.ensureRefs();

    const flowCode = query.flow.trim().toLowerCase() === "import" ? "M" : "X";
    const freqCode = (query.frequency ?? "annual").trim().toLowerCase() === "monthly" ? "M" : "A";
    const year = query.year ?? DEFAULT_YEAR;

    let period: string;
    if (freqCode === "M") {
      const month = query.month;
      if (!month || month < 1 || month > 12) {
        throw new ToolError(
          "Monthly frequency needs a month (1-12).",
          "e.g. { frequency: 'monthly', year: 2024, month: 3 } — or use annual.",
        );
      }
      period = `${year}${String(month).padStart(2, "0")}`;
    } else {
      period = String(year);
    }

    const rawCommodity = (query.commodity ?? "total").trim();
    const cmdCode = COMMODITY_LEVELS[rawCommodity.toLowerCase()] ?? rawCommodity;
    const partnerSpecified = Boolean(query.partner && query.partner.trim());
    // resolvePartner may throw (unknown partner) — before the cache, so errors are never cached.
    const partnerCode = partnerSpecified ? this.resolvePartner(query.partner!) : undefined;

    const cacheKey = `${freqCode}|${flowCode}|${partnerCode ?? "ALL"}|${cmdCode}|${period}`;
    const cached = this.statsCache.get<NormalizedTradeFlow[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ reporterCode: String(NIGERIA_CODE), period, flowCode, cmdCode });
    if (partnerCode !== undefined) params.set("partnerCode", String(partnerCode));

    const body = (await this.getJson(`${PREVIEW_BASE}/C/${freqCode}/HS?${params.toString()}`)) as {
      data?: ComtradeRecord[];
    };
    const rows = body.data ?? [];

    const result = rows
      // Only plain export/import regimes — never mislabel a re-export (RX/RM/…) as export.
      .filter((r) => r.flowCode === "X" || r.flowCode === "M")
      .filter((r) => typeof r.primaryValue === "number" && r.primaryValue > 0)
      // When no partner is specified, drop the World (0) aggregate so results are per-partner.
      .filter((r) => partnerSpecified || r.partnerCode !== 0)
      .map((r) => {
        // Only surface quantity when there's a REAL supplementary unit (e.g. "N" items, "l").
        // Comtrade often sets qty = net weight with no unit — that's already in netWeightKg.
        const unit = typeof r.qtyUnitAbbr === "string" ? r.qtyUnitAbbr.trim() : "";
        const hasQty = typeof r.qty === "number" && r.qty > 0 && unit !== "" && unit !== "N/A" && unit !== "-";
        return stamp(
          {
            reporter: "Nigeria",
            partner: this.partnerName!.get(r.partnerCode) ?? `Comtrade ${r.partnerCode}`,
            hsCode: r.cmdCode,
            commodity: this.commodityName(r.cmdCode),
            flow: (r.flowCode === "M" ? "import" : "export") as "import" | "export",
            period: String(r.period),
            // refYear is normally present; fall back to the period's year so a row missing it
            // can't violate the required NormalizedTradeFlow.year and error the whole call.
            year: typeof r.refYear === "number" ? r.refYear : Number(String(r.period).slice(0, 4)),
            valueUsd: r.primaryValue as number,
            cifValueUsd: typeof r.cifvalue === "number" ? r.cifvalue : null,
            fobValueUsd: typeof r.fobvalue === "number" ? r.fobvalue : null,
            netWeightKg: typeof r.netWgt === "number" && r.netWgt > 0 ? r.netWgt : null,
            quantity: hasQty ? (r.qty as number) : null,
            quantityUnit: hasQty ? unit : null,
          },
          "comtrade",
        );
      })
      .sort((a, b) => b.valueUsd - a.valueUsd);

    // Only cache non-empty results: an empty array often means "not published yet" for a recent
    // period, and negative-caching it would hide the data for STATS_TTL_S once Comtrade fills in.
    if (result.length > 0) this.statsCache.set(cacheKey, result);
    return result;
  }

  async classifyHs(productDescription: string): Promise<NormalizedHsCode> {
    const match = classifyHsLocal(productDescription);
    if (!match) {
      notFound(
        `HS classification for "${productDescription}"`,
        "Free heuristic covers common goods only — wire a commercial classifier (Avalara/Zonos) for full HS coverage.",
      );
    }
    return stamp({ query: productDescription, hsCode: match.hsCode, heading: match.heading }, "heuristic");
  }
}
