/**
 * Lane-local contracts for Nigeria's administrative divisions (states + LGAs).
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Fully offline lane: public reference data bundled with the package — no network,
 * no credentials, no PII.
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

export const NormalizedState = z.object({
  state: z.string().describe("State name (one of Nigeria's 36 states, or 'FCT')"),
  lgaCount: z.number().describe("Number of Local Government Areas in the state"),
  ...Provenance,
});
export type NormalizedState = z.infer<typeof NormalizedState>;

export const NormalizedLgas = z.object({
  state: z.string().describe("Canonical state name as carried in the dataset"),
  lgas: z.array(z.string()).describe("Local Government Areas of the state"),
  ...Provenance,
});
export type NormalizedLgas = z.infer<typeof NormalizedLgas>;

export interface AdminDivisionsProvider {
  readonly name: string;
  listStates(): Promise<NormalizedState[]>;
  getLgas(state: string): Promise<NormalizedLgas>;
}
