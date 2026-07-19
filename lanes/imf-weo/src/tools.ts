/**
 * IMF WEO MCP tools. Provider-agnostic — the tool resolves friendly aliases to raw WEO
 * codes, calls the injected ImfProvider and returns the normalized series as
 * structuredContent. Public macro data, no PII.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import { type ImfProvider, NormalizedImfSeries, WEO_ALIASES } from "./schema.js";

export function imfTools(provider: ImfProvider): ToolDef[] {
  return [
    {
      name: "get_imf_projection",
      title: "IMF WEO series for Nigeria",
      description:
        "Fetch an IMF World Economic Outlook indicator series for Nigeria (NGA) — history plus WEO " +
        "projections. Accepts a friendly alias (gdp_growth, inflation, gdp_per_capita_usd, " +
        "current_account_gdp, gov_debt_gdp, unemployment) or a raw WEO code. includesProjections is a " +
        "heuristic (year >= current calendar year); the IMF's exact estimate/actual boundary runs a " +
        "year or two earlier, so recent years flagged as history may already be IMF estimates, not " +
        "observed outturns.",
      inputSchema: {
        indicator: z
          .string()
          .min(2)
          .max(64)
          .describe(
            "Alias (gdp_growth, inflation, gdp_per_capita_usd, current_account_gdp, gov_debt_gdp, unemployment) or a raw IMF WEO code",
          ),
        start_year: z.number().int().min(1980).optional(),
        end_year: z.number().int().max(2035).optional(),
      },
      outputSchema: NormalizedImfSeries.shape,
      handler: async (args) => {
        const raw = String(args.indicator).trim();
        const aliasKey = raw.toLowerCase();
        // Object.hasOwn, not `?? fallback`: a plain object inherits __proto__/constructor, so
        // WEO_ALIASES["__proto__"] is truthy and would skip the fallback, passing a non-string
        // downstream (code.trim() then throws). hasOwn only matches real alias entries.
        const code = Object.hasOwn(WEO_ALIASES, aliasKey) ? WEO_ALIASES[aliasKey] : raw.toUpperCase();
        const startYear = args.start_year === undefined ? undefined : Number(args.start_year);
        const endYear = args.end_year === undefined ? undefined : Number(args.end_year);
        const rec = await provider.getIndicator(code, startYear, endYear);

        const currentYear = new Date().getFullYear();
        const valued = rec.points.filter((p) => p.value !== null);
        const latestProjection = [...valued].reverse().find((p) => p.year >= currentYear);
        const latest = latestProjection ?? valued[valued.length - 1];
        const text = latestProjection
          ? `${rec.label} — Nigeria: ${latestProjection.value} in ${latestProjection.year} (latest WEO projection; ${rec.points.length} points)`
          : `${rec.label} — Nigeria: ${latest?.value ?? "n/a"} in ${latest?.year ?? "n/a"} (no post-current-year projections in range; recent years may be IMF estimates; ${rec.points.length} points)`;
        return {
          content: [{ type: "text", text }],
          structuredContent: rec,
        };
      },
    },
  ];
}
