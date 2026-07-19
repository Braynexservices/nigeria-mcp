/**
 * Live World Bank adapter — FREE, KEYLESS. World Bank Indicators API v2.
 *
 * Endpoint (VERIFIED live 2026-07-15 with curl):
 *   https://api.worldbank.org/v2/country/NGA/indicator/NY.GDP.MKTP.CD?format=json&per_page=100&date=2020:2023
 *
 * Verified response shape: a 2-element JSON array [meta, rows]
 *   meta = { page, pages, per_page, total, sourceid, lastupdated }
 *   rows = [{ indicator: { id: "NY.GDP.MKTP.CD", value: "GDP (current US$)" },
 *             country: { id: "NG", value: "Nigeria" }, countryiso3code: "NGA",
 *             date: "2023" (string), value: 487387801877.803 (number | null),
 *             unit: "", obs_status: "", decimal: 0 }, ...]   // newest year first
 * Unknown indicator code (VERIFIED): HTTP 200 with a 1-element array
 *   [{ "message": [{ "id": "120", "key": "Invalid value", "value": "The provided parameter value is not valid" }] }]
 *
 * Public macro data, no PII, no key. Annual frequency; per_page=1000 covers 1960->today.
 */
import { fetchJson, stamp, notFound, ToolError } from "@braynexservices/nigeria-mcp-core";
import { INDICATOR_ALIASES, type MacroProvider, type NormalizedMacroSeries } from "../schema.js";

const BASE_URL = "https://api.worldbank.org/v2/country/NGA/indicator";
const FETCH_TIMEOUT_MS = 20_000;
const ALIAS_LIST = Object.entries(INDICATOR_ALIASES)
  .map(([alias, code]) => `${alias} (${code})`)
  .join(", ");

interface WbRow {
  indicator?: { id?: string; value?: string };
  countryiso3code?: string;
  date?: string;
  value?: number | null;
  unit?: string;
}

export class WorldBankMacroProvider implements MacroProvider {
  readonly name = "worldbank";

  async getIndicator(code: string, startYear?: number, endYear?: number): Promise<NormalizedMacroSeries> {
    const wanted = code.trim().toUpperCase();
    const dateParam =
      startYear !== undefined || endYear !== undefined
        ? `&date=${startYear ?? 1960}:${endYear ?? new Date().getUTCFullYear()}`
        : "";
    const pageUrl = (page: number): string =>
      `${BASE_URL}/${encodeURIComponent(wanted)}?format=json&per_page=1000&page=${page}${dateParam}`;

    // Page through until we've collected every row the API reports (meta.pages). per_page=1000
    // means one page for any annual Nigeria series today; the loop just guarantees we never
    // silently truncate a denser series to the first page.
    const rows: WbRow[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const { res, body: raw } = await fetchJson(
        pageUrl(page),
        { headers: { Accept: "application/json" } },
        { service: "World Bank", fallbackHint: "set MACRO_PROVIDER=mock", timeoutMs: FETCH_TIMEOUT_MS },
      );
      if (!res.ok) {
        throw new ToolError(
          `World Bank request failed (HTTP ${res.status}).`,
          "Retry shortly, or set MACRO_PROVIDER=mock.",
        );
      }
      if (!Array.isArray(raw)) {
        throw new ToolError(
          "World Bank returned a malformed (non-array) response.",
          "Retry shortly, or set MACRO_PROVIDER=mock.",
        );
      }
      // Invalid-code envelope: [{ message: [...] }] (still HTTP 200 — verified).
      const meta = raw[0] as { message?: unknown[]; pages?: number } | undefined;
      if (Array.isArray(meta?.message) && meta.message.length > 0) {
        notFound(
          `Macro indicator ${wanted}`,
          `World Bank rejected the code. Use a raw indicator code or an alias: ${ALIAS_LIST}.`,
        );
      }
      const pageRows = raw[1] as WbRow[] | null | undefined;
      if (Array.isArray(pageRows)) rows.push(...pageRows);
      totalPages = typeof meta?.pages === "number" && meta.pages > 0 ? meta.pages : 1;
      page += 1;
    } while (page <= totalPages);

    if (rows.length === 0) {
      notFound(
        `Nigeria data for indicator ${wanted}`,
        `The code may be valid but unreported for NGA in that range. Aliases: ${ALIAS_LIST}.`,
      );
    }

    const points = rows
      .map((r) => ({ year: Number(r.date), value: typeof r.value === "number" ? r.value : null }))
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year);
    const first = rows[0];
    const unit = first.unit && first.unit.trim() !== "" ? first.unit : null;

    return stamp(
      {
        indicator: first.indicator?.id ?? wanted,
        label: first.indicator?.value ?? wanted,
        unit,
        country: "NGA" as const,
        points,
      },
      this.name,
    );
  }
}
