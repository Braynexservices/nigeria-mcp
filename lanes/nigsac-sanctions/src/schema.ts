/**
 * Lane-local contracts for Nigerian sanctions screening (NIGSAC — the Nigeria Sanctions
 * Committee's official list, established under the Terrorism (Prevention and Prohibition)
 * Act 2022; carries both UNSC and domestic designations).
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * A screen result is a SIGNAL, not a legal determination — a POTENTIAL_MATCH needs human
 * review. An unmatched name is a CLEAR result, never an error.
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

export const SanctionsMatch = z.object({
  name: z.string().describe("Listed name that the query matched against"),
  listType: z
    .string()
    .nullable()
    .describe('Which list the entry sits on, e.g. "NIGSAC UNSC" / "NIGSAC domestic"; null when unknown'),
  similarity: z.number().min(0).max(1).describe("Match similarity, 0-1 (1 = exact normalized match)"),
});
export type SanctionsMatch = z.infer<typeof SanctionsMatch>;

export const NormalizedSanctionsScreen = z.object({
  query: z.string().describe("The name that was screened"),
  status: z.enum(["CLEAR", "POTENTIAL_MATCH"]).describe("CLEAR = no candidate matches; POTENTIAL_MATCH = review the matches"),
  matches: z.array(SanctionsMatch).describe("Candidate matches, highest similarity first; empty when CLEAR"),
  listVersion: z.string().nullable().describe("Version/date of the list snapshot screened against, where known"),
  ...Provenance,
});
export type NormalizedSanctionsScreen = z.infer<typeof NormalizedSanctionsScreen>;

export interface SanctionsProvider {
  readonly name: string;
  screen(name: string): Promise<NormalizedSanctionsScreen>;
}
