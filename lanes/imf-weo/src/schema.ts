/**
 * Lane-local contracts for IMF World Economic Outlook (WEO) series on Nigeria.
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Public macro data (no PII). Forward-looking years are IMF WEO projections, not
 * observed outturns — any year >= the current calendar year counts as a projection.
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

/** Friendly alias -> raw IMF WEO indicator code. */
export const WEO_ALIASES: Record<string, string> = {
  gdp_growth: "NGDP_RPCH",
  inflation: "PCPIPCH",
  gdp_per_capita_usd: "NGDPDPC",
  current_account_gdp: "BCA_NGDPD",
  gov_debt_gdp: "GGXWDG_NGDP",
  unemployment: "LUR",
};

/** Human labels for the aliased codes; raw codes outside this map fall back to the code itself. */
export const WEO_LABELS: Record<string, string> = {
  NGDP_RPCH: "Real GDP growth (annual % change)",
  PCPIPCH: "Inflation, average consumer prices (annual % change)",
  NGDPDPC: "GDP per capita, current prices (US dollars)",
  BCA_NGDPD: "Current account balance (% of GDP)",
  GGXWDG_NGDP: "General government gross debt (% of GDP)",
  LUR: "Unemployment rate (% of labor force)",
};

export const WeoPoint = z.object({
  year: z.number().int().describe("Calendar year"),
  value: z.number().nullable().describe("Indicator value for that year (null where the WEO reports no figure)"),
});
export type WeoPoint = z.infer<typeof WeoPoint>;

export const NormalizedImfSeries = z.object({
  indicator: z.string().describe("Raw IMF WEO indicator code, e.g. NGDP_RPCH"),
  label: z.string().describe("Human-readable indicator label"),
  country: z.string().describe('ISO3 country code — always "NGA" for this lane'),
  points: z.array(WeoPoint).describe("Year/value points, ascending by year"),
  includesProjections: z
    .boolean()
    .describe("True when the series contains WEO projection years (any year >= the current calendar year)"),
  ...Provenance,
});
export type NormalizedImfSeries = z.infer<typeof NormalizedImfSeries>;

export interface ImfProvider {
  readonly name: string;
  /** `code` is a raw WEO indicator code — tools resolve friendly aliases before calling. */
  getIndicator(code: string, startYear?: number, endYear?: number): Promise<NormalizedImfSeries>;
}
