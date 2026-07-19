/**
 * Mock IMF WEO provider — the default. Serves deterministic fixture series so the lane
 * runs with zero signup and no network. Swap via IMF_PROVIDER env.
 */
import { stamp, notFound } from "@braynexservices/nigeria-mcp-core";
import { type ImfProvider, type NormalizedImfSeries, WEO_ALIASES, WEO_LABELS } from "../schema.js";
import { SERIES } from "../fixtures.js";

export class MockImfProvider implements ImfProvider {
  readonly name = "mock";

  async getIndicator(code: string, startYear?: number, endYear?: number): Promise<NormalizedImfSeries> {
    const c = code.trim().toUpperCase();
    const rec = SERIES.find((s) => s.code === c);
    if (!rec) {
      notFound(
        `IMF WEO indicator ${c} (mock)`,
        `Mock data covers: ${SERIES.map((s) => s.code).join(", ")}. ` +
          `Aliases: ${Object.keys(WEO_ALIASES).join(", ")}.`,
      );
    }
    let points = [...rec.points].sort((a, b) => a.year - b.year);
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
        indicator: rec.code,
        label: WEO_LABELS[rec.code] ?? rec.label,
        country: "NGA",
        points,
        includesProjections: points.some((p) => p.year >= currentYear),
      },
      this.name,
    );
  }
}
