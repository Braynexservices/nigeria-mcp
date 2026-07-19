/**
 * Mock macro provider — the default. Resolves indicator codes against deterministic
 * fixtures so the lane runs with zero network. Swap via MACRO_PROVIDER env.
 */
import { stamp, notFound } from "@braynexservices/nigeria-mcp-core";
import { INDICATOR_ALIASES, type MacroProvider, type NormalizedMacroSeries } from "../schema.js";
import { SERIES } from "../fixtures.js";

const ALIAS_LIST = Object.entries(INDICATOR_ALIASES)
  .map(([alias, code]) => `${alias} (${code})`)
  .join(", ");

export class MockMacroProvider implements MacroProvider {
  readonly name = "mock";

  async getIndicator(code: string, startYear?: number, endYear?: number): Promise<NormalizedMacroSeries> {
    const wanted = code.trim().toUpperCase();
    const rec = SERIES.find((s) => s.indicator === wanted);
    if (!rec) {
      notFound(
        `Macro indicator ${code}`,
        `Mock data is limited. Known aliases: ${ALIAS_LIST}. Set MACRO_PROVIDER=worldbank for the full live catalogue.`,
      );
    }
    const points = rec.points.filter(
      (p) => (startYear === undefined || p.year >= startYear) && (endYear === undefined || p.year <= endYear),
    );
    return stamp(
      {
        indicator: rec.indicator,
        label: rec.label,
        unit: rec.unit,
        country: "NGA" as const,
        points,
      },
      this.name,
    );
  }
}
