/**
 * Lane-local contracts for Nigerian macroeconomic indicators (World Bank).
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Public macro data (GDP, inflation, population, ...) — no PII anywhere in this lane.
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

/**
 * Friendly aliases -> raw World Bank indicator codes. The tool accepts either form;
 * the mock provider's not-found hint lists these so agents can self-correct.
 */
export const INDICATOR_ALIASES = {
  gdp: "NY.GDP.MKTP.CD",
  gdp_growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  population: "SP.POP.TOTL",
  remittances: "BX.TRF.PWKR.CD.DT",
  fdi: "BX.KLT.DINV.CD.WD",
  unemployment: "SL.UEM.TOTL.ZS",
} as const;
export type IndicatorAlias = keyof typeof INDICATOR_ALIASES;

export const MacroPoint = z.object({
  year: z.number().int().describe("Observation year"),
  value: z.number().nullable().describe("Observed value, or null where the source reports no data for that year"),
});
export type MacroPoint = z.infer<typeof MacroPoint>;

export const NormalizedMacroSeries = z.object({
  indicator: z.string().describe("World Bank indicator code, e.g. NY.GDP.MKTP.CD"),
  label: z.string().describe("Human-readable indicator name, e.g. 'GDP (current US$)'"),
  unit: z.string().nullable().describe("Unit of measure where the source reports one (World Bank usually folds it into the label)"),
  country: z.literal("NGA").describe("ISO3 country code — this lane is Nigeria-only"),
  points: z.array(MacroPoint).describe("Time series, ascending by year"),
  ...Provenance,
});
export type NormalizedMacroSeries = z.infer<typeof NormalizedMacroSeries>;

export interface MacroProvider {
  readonly name: string;
  getIndicator(code: string, startYear?: number, endYear?: number): Promise<NormalizedMacroSeries>;
}
