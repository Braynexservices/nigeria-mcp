/**
 * Mock SDG provider — the default. Resolves series against deterministic fixtures so the
 * lane runs with zero signup and no network. Swap via SDG_PROVIDER env (SDG_PROVIDER=unsdg
 * for the live, keyless UN SDG API adapter).
 */
import { stamp, notFound } from "@braynexservices/nigeria-mcp-core";
import { type SdgProvider, type NormalizedSdgSeries, SDG_ALIASES } from "../schema.js";
import { SERIES } from "../fixtures.js";

export class MockSdgProvider implements SdgProvider {
  readonly name = "mock";

  async getSeries(seriesCode: string, startYear?: number, endYear?: number): Promise<NormalizedSdgSeries> {
    const code = seriesCode.trim().toUpperCase();
    const rec = SERIES.find((s) => s.seriesCode === code);
    if (!rec) {
      notFound(
        `SDG series ${seriesCode}`,
        `Known aliases: ${Object.keys(SDG_ALIASES).join(", ")} — or pass a raw UN SDG series code. ` +
          `Mock data covers: ${SERIES.map((s) => s.seriesCode).join(", ")}.`,
      );
    }
    const points = rec.points
      .filter((p) => (startYear === undefined || p.year >= startYear) && (endYear === undefined || p.year <= endYear))
      .sort((a, b) => a.year - b.year);
    return stamp(
      {
        seriesCode: rec.seriesCode,
        description: rec.description,
        goal: rec.goal,
        country: "Nigeria (566)",
        points,
      },
      this.name,
    );
  }
}
