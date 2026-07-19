/**
 * Macro MCP tools. Provider-agnostic — resolves friendly aliases to World Bank indicator
 * codes, calls the injected MacroProvider, and returns the normalized series as
 * structuredContent. Public macro data — no PII.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import { INDICATOR_ALIASES, type MacroProvider, NormalizedMacroSeries } from "./schema.js";

/** Resolve a friendly alias (case-insensitive) to its World Bank code; raw codes pass through. */
export function resolveIndicator(input: string): string {
  const key = input.trim().toLowerCase();
  // Object.hasOwn, not `?? fallback`: a plain object inherits __proto__/constructor, whose
  // lookups are truthy and would skip the fallback, passing a non-string code downstream.
  return Object.hasOwn(INDICATOR_ALIASES, key)
    ? (INDICATOR_ALIASES as Record<string, string>)[key]
    : input.trim().toUpperCase();
}

export function macroTools(provider: MacroProvider): ToolDef[] {
  return [
    {
      name: "get_macro_indicator",
      title: "Nigeria macro indicator",
      description:
        "Fetch a Nigerian macroeconomic time series (World Bank Indicators, country NGA). Accepts a friendly " +
        "alias — gdp, gdp_growth, inflation, population, remittances, fdi, unemployment — or any raw World Bank " +
        "indicator code (e.g. NY.GDP.MKTP.CD). Returns annual points, ascending by year; optional year bounds. " +
        "Public macro data, no PII.",
      inputSchema: {
        indicator: z
          .string()
          .min(2)
          .max(64)
          .describe(
            "Alias (gdp, gdp_growth, inflation, population, remittances, fdi, unemployment) or a raw World Bank indicator code",
          ),
        start_year: z.number().int().min(1960).optional().describe("Earliest year to include (default: full history)"),
        end_year: z.number().int().max(2035).optional().describe("Latest year to include (default: latest available)"),
      },
      outputSchema: NormalizedMacroSeries.shape,
      handler: async (args) => {
        const code = resolveIndicator(String(args.indicator));
        const startYear = args.start_year === undefined ? undefined : Number(args.start_year);
        const endYear = args.end_year === undefined ? undefined : Number(args.end_year);
        const series = await provider.getIndicator(code, startYear, endYear);
        const latest = [...series.points].reverse().find((p) => p.value !== null);
        const text = latest
          ? `${series.label} — Nigeria: latest ${latest.year} = ${latest.value?.toLocaleString("en-US")} ` +
            `(${series.indicator}, ${series.points.length} point${series.points.length === 1 ? "" : "s"})`
          : `${series.label} — Nigeria: no non-null observations in the requested range (${series.indicator})`;
        return {
          content: [{ type: "text", text }],
          structuredContent: series,
        };
      },
    },
  ];
}
