/**
 * Live IMF WEO adapter — the IMF DataMapper API. FREE and KEYLESS; public macro data,
 * no PII, no signup.
 *
 * Endpoint (VERIFIED live 2026-07-15 with Node fetch):
 *   GET https://www.imf.org/external/datamapper/api/v1/{CODE}/NGA
 *   -> HTTP 200, shape { values: { {CODE}: { NGA: { "2024": 3.1, ... }, ...otherISO3 } },
 *      api: { version: "1", "output-method": "json" } }
 *
 * Verified quirks (probe results, NGDP_RPCH/NGA):
 * - The trailing /NGA country segment did NOT filter — all 229 ISO3 keys came back.
 *   We therefore always index values[CODE].NGA, which works filtered or not.
 * - An unknown indicator code returns HTTP 200 with a DIFFERENT body
 *   ({ countries: { ABW: {...}, ... } }, no "values" key) — a missing values[CODE].NGA
 *   is the not-found signal, not the HTTP status.
 * - The Akamai edge 403s curl-like clients; Node's fetch (undici) passes. Probe values
 *   at verification time: NGA NGDP_RPCH 1991–2031, 2025 = 4.0.
 *
 * Projections: WEO series run past the present. Any year >= the current calendar year
 * counts as a projection (approximation of the WEO vintage cut-over) — flagged via
 * includesProjections.
 */
import { fetchJson, stamp, notFound, ToolError, MemoryCache } from "@braynexservices/nigeria-mcp-core";
import { type ImfProvider, type NormalizedImfSeries, WEO_ALIASES, WEO_LABELS } from "../schema.js";

const API_BASE = "https://www.imf.org/external/datamapper/api/v1";
const FETCH_TIMEOUT_MS = 15_000;
// WEO vintages update ~twice a year; a 6h cache cuts repeat pulls of the large payload.
const SERIES_TTL_S = 6 * 3600;

interface DataMapperResponse {
  values?: Record<string, Record<string, Record<string, unknown>>>;
}

export class ImfWeoProvider implements ImfProvider {
  readonly name = "imf";
  /** Caches the parsed NGA year-map per indicator code (~6h). */
  private readonly cache = new MemoryCache(SERIES_TTL_S);

  /** Fetch (or reuse cached) the NGA year->value map for one indicator code. */
  private async ngaSeries(code: string): Promise<Record<string, unknown>> {
    const cached = this.cache.get<Record<string, unknown>>(code);
    if (cached) return cached;

    const { res, body } = await fetchJson(
      `${API_BASE}/${encodeURIComponent(code)}/NGA`,
      { headers: { Accept: "application/json" } },
      { service: "IMF", fallbackHint: "set IMF_PROVIDER=mock", timeoutMs: FETCH_TIMEOUT_MS },
    );
    if (!res.ok) {
      throw new ToolError(
        `IMF DataMapper request failed (HTTP ${res.status}).`,
        "Retry shortly, or set IMF_PROVIDER=mock.",
      );
    }
    if (body === null) {
      throw new ToolError(
        "IMF DataMapper returned a malformed (non-JSON) response.",
        "Retry shortly, or set IMF_PROVIDER=mock.",
      );
    }
    // Unknown codes come back 200 with a { countries } body — no values[CODE].NGA.
    const series = (body as DataMapperResponse).values?.[code]?.NGA;
    if (!series || typeof series !== "object") {
      notFound(
        `IMF WEO indicator ${code} for Nigeria`,
        `Check the WEO code, or use an alias: ${Object.keys(WEO_ALIASES).join(", ")}.`,
      );
    }
    this.cache.set(code, series);
    return series;
  }

  async getIndicator(code: string, startYear?: number, endYear?: number): Promise<NormalizedImfSeries> {
    const c = code.trim().toUpperCase();
    const series = await this.ngaSeries(c);

    let points = Object.entries(series)
      .map(([year, value]) => ({
        year: Number(year),
        value: typeof value === "number" && Number.isFinite(value) ? value : null,
      }))
      .filter((p) => Number.isInteger(p.year))
      .sort((a, b) => a.year - b.year);
    if (startYear !== undefined) points = points.filter((p) => p.year >= startYear);
    if (endYear !== undefined) points = points.filter((p) => p.year <= endYear);
    if (points.length === 0) {
      notFound(
        `IMF WEO ${c} data for Nigeria in the requested year range`,
        "Widen start_year / end_year.",
      );
    }

    const currentYear = new Date().getFullYear();
    return stamp(
      {
        indicator: c,
        label: WEO_LABELS[c] ?? c,
        country: "NGA",
        points,
        includesProjections: points.some((p) => p.year >= currentYear),
      },
      this.name,
    );
  }
}
