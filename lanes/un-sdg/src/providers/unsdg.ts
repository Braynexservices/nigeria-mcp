/**
 * Live UN SDG adapter — the UN SDG Global Database API (keyless).
 *
 * Endpoint (verified live 2026-07-15/17 for all five aliased series):
 *   GET https://unstats.un.org/sdgapi/v1/sdg/Series/Data?seriesCode={CODE}&areaCode=566&pageSize=500&page={N}
 *   -> { size, totalElements, data: [ { seriesDescription, series, goal: ["1"],
 *        timePeriodStart: 2020.0, value: "30.9", dimensions: {...}, ... } ] }
 *
 * Values arrive as strings; timePeriodStart as a float year.
 *
 * Selecting the NATIONAL headline row per year is the subtle part. A series reports many rows
 * per year across sex/location/age/education dimensions. The naive "every dimension is a total
 * (BOTHSEX/ALLAREA/_T)" rule silently returns a disaggregated row for series whose national row
 * is not all-total: e.g. under-5 mortality carries Age=<5Y (the indicator's defining age, never
 * "ALLAGE"), and primary-completion carries Education level=PRIMAR (the rate is reported per
 * level, so "primary" IS the target, not a total). We therefore:
 *   1. Ignore dimensions that take a single value across the series (constants like Age=<5Y are
 *      not a disaggregation).
 *   2. For real (multi-valued) dimensions, require the TOTAL value — unless the series pins that
 *      dimension to a specific value (SERIES_DIMENSION_PINS), which is how "primary completion"
 *      selects Education level=PRIMAR.
 *   3. Page through totalElements so a dense series (e.g. SE_TOT_CPLR ~1300 rows) is never
 *      silently truncated to the first page.
 *   4. If no national row can be identified for ANY year, error out rather than emit a
 *      confidently-wrong disaggregated value.
 */
import { fetchJson, providerKey, ToolError, stamp } from "@braynexservices/nigeria-mcp-core";
import { type SdgProvider, type NormalizedSdgSeries } from "../schema.js";

interface SdgRow {
  seriesDescription?: string;
  series?: string;
  goal?: unknown[];
  timePeriodStart?: number;
  value?: string;
  dimensions?: Record<string, string>;
}

interface SdgEnvelope {
  totalElements?: number;
  data?: SdgRow[];
}

const PAGE_SIZE = 500;
const MAX_PAGES = 40; // hard safety cap: 40 * 500 = 20k rows, far above any single Nigeria series

const TOTAL_DIMENSION_VALUES = new Set(["BOTHSEX", "ALLAREA", "ALLAGE", "_T", "TOTAL", "ALL"]);

/**
 * Dimensions whose national headline is a SPECIFIC value rather than an aggregate total.
 * Keyed by series code; dimension name -> the value identifying the national headline row.
 * The completion-rate series report a rate per education level, so "primary completion" is
 * Education level=PRIMAR (there is no synthetic "all levels" total).
 */
const SERIES_DIMENSION_PINS: Record<string, Record<string, string>> = {
  SE_TOT_CPLR: { "Education level": "PRIMAR" },
};

const pinsFor = (code: string): Record<string, string> =>
  Object.hasOwn(SERIES_DIMENSION_PINS, code) ? SERIES_DIMENSION_PINS[code] : {};

/** Dimension keys that take more than one distinct value across the series (real disaggregations). */
function disaggregatingDims(rows: SdgRow[]): Set<string> {
  const seen = new Map<string, Set<string>>();
  for (const row of rows) {
    for (const [k, v] of Object.entries(row.dimensions ?? {})) {
      if (k === "Reporting Type") continue;
      let set = seen.get(k);
      if (!set) seen.set(k, (set = new Set()));
      set.add(String(v).toUpperCase());
    }
  }
  return new Set([...seen].filter(([, s]) => s.size > 1).map(([k]) => k));
}

/** Is this row the national headline — total on every disaggregating dim (or the pinned value)? */
function isNationalRow(row: SdgRow, disagg: Set<string>, pins: Record<string, string>): boolean {
  const dims = row.dimensions ?? {};
  for (const dim of disagg) {
    const val = (dims[dim] ?? "").toUpperCase();
    if (Object.hasOwn(pins, dim)) {
      if (val !== pins[dim].toUpperCase()) return false;
    } else if (!TOTAL_DIMENSION_VALUES.has(val)) {
      return false;
    }
  }
  return true;
}

export class UnSdgProvider implements SdgProvider {
  readonly name = "unsdg";

  constructor(
    private readonly baseUrl = providerKey("UN_SDG_BASE_URL", "https://unstats.un.org/sdgapi"),
  ) {}

  private async fetchAllRows(code: string): Promise<SdgRow[]> {
    const rows: SdgRow[] = [];
    let total = Infinity;
    for (let page = 1; page <= MAX_PAGES && rows.length < total; page++) {
      const url =
        `${this.baseUrl}/v1/sdg/Series/Data?seriesCode=${encodeURIComponent(code)}` +
        `&areaCode=566&pageSize=${PAGE_SIZE}&page=${page}`;
      const { res, body } = await fetchJson(
        url,
        { method: "GET", headers: { Accept: "application/json" } },
        { service: "UN SDG", fallbackHint: "set SDG_PROVIDER=mock" },
      );
      if (res.status >= 400) {
        throw new ToolError(`UN SDG API returned HTTP ${res.status}.`, "Check the series code, or set SDG_PROVIDER=mock.");
      }
      const env = (body ?? {}) as SdgEnvelope;
      const pageRows = env.data ?? [];
      rows.push(...pageRows);
      total = typeof env.totalElements === "number" ? env.totalElements : rows.length;
      if (pageRows.length === 0) break; // defensive: never loop on an empty page
    }
    return rows;
  }

  async getSeries(seriesCode: string, startYear?: number, endYear?: number): Promise<NormalizedSdgSeries> {
    const code = seriesCode.trim().toUpperCase();
    const rows = await this.fetchAllRows(code);
    if (rows.length === 0) {
      throw new ToolError(
        `No UN SDG data for series "${code}" in Nigeria (area 566).`,
        "Check the series code (e.g. SI_POV_DAY1) or use a friendly alias.",
      );
    }

    const disagg = disaggregatingDims(rows);
    const pins = pinsFor(code);

    // Keep ONE national headline value per year. Only national rows contribute a value; a year
    // with no national row is recorded as null (present but unresolved) rather than a
    // disaggregated stand-in.
    const byYear = new Map<number, number | null>();
    let nationalHits = 0;
    for (const row of rows) {
      const year = Math.trunc(Number(row.timePeriodStart));
      if (!Number.isFinite(year) || year === 0) continue;
      if (startYear && year < startYear) continue;
      if (endYear && year > endYear) continue;
      if (!isNationalRow(row, disagg, pins)) continue;
      nationalHits++;
      const value =
        row.value != null && row.value !== "" && !Number.isNaN(Number(row.value)) ? Number(row.value) : null;
      if (!byYear.has(year)) byYear.set(year, value);
    }

    // No national row found anywhere → the series' dimension structure isn't understood. Fail
    // loudly instead of returning a confidently-wrong disaggregated figure.
    if (nationalHits === 0) {
      throw new ToolError(
        `Could not identify a national (all-Nigeria) row for series "${code}".`,
        "This series may need an explicit dimension selection; set SDG_PROVIDER=mock or try a headline alias (e.g. extreme_poverty).",
      );
    }

    const points = [...byYear.entries()]
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);

    const first = rows[0];
    const goals = Array.isArray(first.goal) ? first.goal.map(String) : [];
    return stamp(
      {
        seriesCode: code,
        description: first.seriesDescription ?? code,
        goal: goals[0] ?? null,
        country: "Nigeria (566)",
        points,
      },
      this.name,
    );
  }
}
