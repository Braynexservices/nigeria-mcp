/**
 * Lane-local contracts for Nigeria's UN SDG indicators.
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Public statistical data (UN SDG Global Database), no PII. Nigeria-only (M49 area 566).
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

/**
 * Friendly alias -> UN SDG series code. All five codes verified LIVE against
 * https://unstats.un.org/sdgapi/v1/sdg/Series/Data?seriesCode={CODE}&areaCode=566 on 2026-07-15.
 *
 * NOTE: primary_school_completion maps to SE_TOT_CPLR ("Completion rate, by sex, location,
 * wealth quintile and education level (%)", indicator 4.1.2) — NOT SE_TOT_PRFL, which is the
 * minimum-proficiency series (indicator 4.1.1), a different measure.
 */
export const SDG_ALIASES: Record<string, string> = {
  extreme_poverty: "SI_POV_DAY1",
  under5_mortality: "SH_DYN_MORT",
  electricity_access: "EG_ACS_ELEC",
  water_access: "SP_ACS_BSRVH2O",
  primary_school_completion: "SE_TOT_CPLR",
};

export const SdgPoint = z.object({
  year: z.number().int().describe("Reporting year, e.g. 2020"),
  value: z.number().nullable().describe("Indicator value for that year (null where the source reports no numeric value)"),
});
export type SdgPoint = z.infer<typeof SdgPoint>;

export const NormalizedSdgSeries = z.object({
  seriesCode: z.string().describe("UN SDG series code, e.g. SI_POV_DAY1"),
  description: z.string().describe("Official series description, e.g. 'Proportion of population below international poverty line (%)'"),
  goal: z.string().nullable().describe("SDG goal number this series reports under, e.g. '1' (null if not reported)"),
  country: z.string().describe("Always 'Nigeria (566)' — this lane is Nigeria-only"),
  points: z.array(SdgPoint).describe("One headline data point per year, sorted by year ascending"),
  ...Provenance,
});
export type NormalizedSdgSeries = z.infer<typeof NormalizedSdgSeries>;

export interface SdgProvider {
  readonly name: string;
  getSeries(seriesCode: string, startYear?: number, endYear?: number): Promise<NormalizedSdgSeries>;
}
