/**
 * UN SDG MCP tools. Provider-agnostic — the tool resolves friendly aliases to series
 * codes, calls the injected SdgProvider and returns the normalized series as
 * structuredContent. Public statistical data, no PII.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import { type SdgProvider, NormalizedSdgSeries, SDG_ALIASES } from "./schema.js";

export function sdgTools(provider: SdgProvider): ToolDef[] {
  return [
    {
      name: "get_sdg_indicator",
      title: "UN SDG indicator for Nigeria",
      description:
        "Fetch a UN Sustainable Development Goals indicator series for Nigeria (development indicators: " +
        "poverty, health, education, energy access). Accepts a friendly alias (extreme_poverty, " +
        "under5_mortality, electricity_access, water_access, primary_school_completion) or a raw UN SDG " +
        "series code like SI_POV_DAY1. Example: { series: 'extreme_poverty' }.",
      inputSchema: {
        series: z
          .string()
          .min(2)
          .max(64)
          .describe("Alias (extreme_poverty, under5_mortality, electricity_access, water_access, primary_school_completion) or a raw UN SDG series code"),
        start_year: z.number().int().min(2000).optional(),
        end_year: z.number().int().max(2035).optional(),
      },
      outputSchema: NormalizedSdgSeries.shape,
      handler: async (args) => {
        const raw = String(args.series).trim();
        const aliasKey = raw.toLowerCase();
        // Object.hasOwn, not `?? fallback`: SDG_ALIASES["__proto__"]/["constructor"] are inherited
        // and truthy, so the fallback would be skipped and a non-string code reach the provider.
        const code = Object.hasOwn(SDG_ALIASES, aliasKey) ? SDG_ALIASES[aliasKey] : raw.toUpperCase();
        const startYear = args.start_year === undefined ? undefined : Number(args.start_year);
        const endYear = args.end_year === undefined ? undefined : Number(args.end_year);
        const rec = await provider.getSeries(code, startYear, endYear);
        const valued = rec.points.filter((p) => p.value !== null);
        const latest = valued[valued.length - 1];
        return {
          content: [
            {
              type: "text",
              text: `${rec.description} — Nigeria: ${latest ? `${latest.value} in ${latest.year}` : "no valued points in range"} (${rec.points.length} points)`,
            },
          ],
          structuredContent: rec,
        };
      },
    },
  ];
}
