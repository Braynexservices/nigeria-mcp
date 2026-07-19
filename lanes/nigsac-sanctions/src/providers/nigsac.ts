/**
 * Live NIGSAC adapter — screens against the official Nigeria Sanctions Committee list.
 *
 * Source reality (investigated + VERIFIED live 2026-07-16): nigsac.gov.ng publishes the
 * Nigeria designations as SERVER-RENDERED HTML tables (DataTables applied client-side —
 * no ajax/JSON source; candidate JSON endpoints all 404). So this adapter fetches the
 * list page, parses the <tr> rows, caches in-process (the list changes rarely), and
 * screens locally with the same match.ts logic as the mock.
 *
 * VERIFIED: the page carries TWO tables — individuals AND entities — and this parser
 * reads both (2026-07-16: 69 entries = 55 persons + 14 entities, e.g. "NINE TO NINE BDC
 * LTD"). Parse quality confirmed against real rows; no nav/junk rows leak through.
 *
 * SCOPE, and it matters: this is the NIGERIA (domestic) list only. The UN consolidated
 * list is linked off-site by NIGSAC and is NOT screened here — so a CLEAR result means
 * "not on the Nigerian list", not "not sanctioned anywhere". Wiring the UN list is a
 * separate lane's job.
 *
 * Overrides:
 *   NIGSAC_LIST_URL — either an HTML list page (parsed as below) OR a founder-hosted
 *   JSON array of { name, listType } (detected by a leading "[").
 *
 * Public designation data — the names on the list are published sanction designations,
 * not private PII. Query names are pass-through, never persisted.
 */
import { providerKey, ToolError, stamp } from "@braynexservices/nigeria-mcp-core";
import { type SanctionsProvider, type NormalizedSanctionsScreen } from "../schema.js";
import { screenList, type ListEntry } from "../match.js";

// Verified live 2026-07-15 and re-verified 2026-07-18 (HTTP 200, two tables — individuals AND
// entities — ~69 rows, entity names like "... BDC LTD" present): the Nigeria (domestic)
// sanctions list page. The site also links the UN consolidated list off-site; this path is the
// NG designations register.
const DEFAULT_LIST_URL = "https://nigsac.gov.ng/IndSancList";
const USER_AGENT = "nigeria-mcp/1.0 (+https://www.braynexservices.com)";
const FETCH_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // re-fetch the list at most every 6h (it changes rarely)
// Refuse to screen against a scrape smaller than this — the real register is ~69 entries, so a
// handful of rows means a changed layout / error / challenge page, and screening against it
// would silently CLEAR real names. Fail loud instead. (Not applied to a trusted JSON override.)
const MIN_PLAUSIBLE_ENTRIES = 30;
const FETCH_HINT =
  "The portal may be down or its layout changed. Set SANCTIONS_PROVIDER=mock, or point NIGSAC_LIST_URL at a hosted JSON list of {name, listType}.";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Strip tags + collapse whitespace from an HTML fragment. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse <tr> rows out of the first HTML table: first non-numeric cell = the listed name. */
export function parseListHtml(html: string): ListEntry[] {
  const entries: ListEntry[] = [];
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const cells = (row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(textOf).filter(Boolean);
    if (cells.length === 0) continue;
    // skip header rows
    if (/^(s\/?n|#|name)$/i.test(cells[0]) || /name/i.test(cells[0]) === false && cells.length === 1) {
      if (/^(s\/?n|#|name|no\.?)$/i.test(cells[0])) continue;
    }
    const name = /^\d+\.?$/.test(cells[0]) ? cells[1] : cells[0];
    if (!name || /^(s\/?n|#|name|no\.?)$/i.test(name)) continue;
    const listType = cells.find((c) => /unsc|domestic|un list|nigeria/i.test(c) && c !== name) ?? null;
    entries.push({ name, listType: listType ? `NIGSAC ${listType}` : "NIGSAC" });
  }
  return entries;
}

export class NigsacSanctionsProvider implements SanctionsProvider {
  readonly name = "nigsac";
  private cache: { entries: ListEntry[]; version: string; fetchedAt: number } | null = null;

  constructor(private readonly listUrl = providerKey("NIGSAC_LIST_URL", DEFAULT_LIST_URL)) {}

  /** Fetch the list page with a per-attempt timeout and backoff-retry on transient failures. */
  private async fetchListText(): Promise<string> {
    let lastError: ToolError | null = null;
    for (const backoff of [0, 600, 1500]) {
      if (backoff) await sleep(backoff);
      let res: Response;
      try {
        res = await fetch(this.listUrl, {
          headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json" },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
      } catch {
        lastError = new ToolError("NIGSAC portal did not respond (network error or timeout).", FETCH_HINT);
        continue;
      }
      if (res.status === 429 || res.status >= 500) {
        lastError = new ToolError(`NIGSAC portal is unavailable (HTTP ${res.status}).`, FETCH_HINT);
        continue;
      }
      if (!res.ok) {
        throw new ToolError(`NIGSAC list fetch failed (HTTP ${res.status}).`, FETCH_HINT);
      }
      return await res.text();
    }
    throw lastError ?? new ToolError("NIGSAC list fetch failed after retries.", FETCH_HINT);
  }

  private async loadList(): Promise<{ entries: ListEntry[]; version: string; fetchedAt: number }> {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) return this.cache;

    const text = await this.fetchListText();
    let entries: ListEntry[];
    if (text.trimStart().startsWith("[")) {
      // Trusted JSON override (NIGSAC_LIST_URL points at a founder-hosted list): no plausibility
      // floor, since a custom list may legitimately be small — only the empty case is rejected.
      const rows = JSON.parse(text) as Array<{ name?: string; listType?: string | null }>;
      entries = rows
        .filter((r) => typeof r.name === "string" && r.name.trim())
        .map((r) => ({ name: r.name!.trim(), listType: r.listType ?? "NIGSAC" }));
      if (entries.length === 0) {
        throw new ToolError("NIGSAC JSON override contained zero usable entries.", FETCH_HINT);
      }
    } else {
      entries = parseListHtml(text);
      // Plausibility floor: a scrape far below the known register size means we parsed garbage
      // (changed layout / error / challenge page). Screening against it would falsely CLEAR real
      // names — so refuse rather than return a dangerous CLEAR.
      if (entries.length < MIN_PLAUSIBLE_ENTRIES) {
        throw new ToolError(
          `NIGSAC list parsed to only ${entries.length} entries (expected >= ${MIN_PLAUSIBLE_ENTRIES}) — the page layout may have changed or the portal returned an error/challenge page.`,
          `Refusing to screen against a truncated list (it would clear real names). ${FETCH_HINT}`,
        );
      }
    }
    this.cache = {
      entries,
      version: `nigsac-${new Date().toISOString().slice(0, 10)}-${entries.length}`,
      fetchedAt: Date.now(),
    };
    return this.cache;
  }

  async screen(name: string): Promise<NormalizedSanctionsScreen> {
    const { entries, version } = await this.loadList();
    const { status, matches } = screenList(name, entries);
    return stamp({ query: name, status, matches, listVersion: version }, this.name);
  }
}
