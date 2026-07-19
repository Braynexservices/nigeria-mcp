/**
 * Static (bundled) admin-divisions provider — the DEFAULT and only provider: this lane
 * is fully offline, serving Nigeria's states + LGAs from JSON compiled into the package.
 *
 * Dataset: src/data/nigeria-divisions.json, extracted 2026-07-15 from
 * temikeezy/nigeria-geojson-data (data/full.json)
 *   Source: https://github.com/temikeezy/nigeria-geojson-data
 *   Licence: MIT (Copyright (c) 2025 Temi)
 * Transformations applied on extraction (wards/coordinates dropped — this lane carries
 * the state -> LGA-names mapping only):
 *   - "Federal Capital Territory" normalized to "FCT"
 *   - source spelling "Nassarawa" normalized to the official "Nasarawa"
 *   - Lagos LGA "Badagary" corrected to the official "Badagry"
 * Verified counts: 37 states (36 + FCT), 774 LGAs total; Lagos includes "Eti-Osa".
 */
import { stamp, notFound } from "@braynexservices/nigeria-mcp-core";
import { type AdminDivisionsProvider, type NormalizedState, type NormalizedLgas } from "../schema.js";
import divisions from "../data/nigeria-divisions.json" with { type: "json" };

interface Division {
  state: string;
  lgas: string[];
}

const DATA: Division[] = divisions;

/** Common alternate names resolved to the canonical dataset spelling (lower-cased keys). */
const ALIASES: Record<string, string> = {
  "federal capital territory": "FCT",
  abuja: "FCT",
  nassarawa: "Nasarawa",
};

export class StaticAdminDivisionsProvider implements AdminDivisionsProvider {
  readonly name = "static";

  async listStates(): Promise<NormalizedState[]> {
    return DATA.map((d) => stamp({ state: d.state, lgaCount: d.lgas.length }, this.name));
  }

  async getLgas(state: string): Promise<NormalizedLgas> {
    const query = state.trim().toLowerCase();
    // Object.hasOwn, not `?? fallback`: ALIASES["__proto__"]/["constructor"] are inherited and
    // truthy, so `?? query` would be skipped and a non-string would reach .toLowerCase().
    const canonical = (Object.hasOwn(ALIASES, query) ? ALIASES[query] : query).toLowerCase();
    const rec = DATA.find((d) => d.state.toLowerCase() === canonical);
    if (!rec) {
      const close = DATA.filter((d) => {
        const name = d.state.toLowerCase();
        return name.startsWith(query.slice(0, 3)) || name.includes(query) || query.includes(name);
      }).map((d) => d.state);
      const hint = close.length
        ? `Did you mean: ${close.join(", ")}? Use list_states for all 37 valid names.`
        : "Use list_states for the 37 valid names (36 states + FCT).";
      notFound(`State "${state}"`, hint);
    }
    return stamp({ state: rec.state, lgas: [...rec.lgas] }, this.name);
  }
}
