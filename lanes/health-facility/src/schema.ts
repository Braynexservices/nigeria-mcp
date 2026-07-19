/**
 * Lane-local contracts for health facility lookup.
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Facility locations are public infrastructure data (GRID3 / Nigeria Health Facility
 * Registry) — no PII. Live source attribution: GRID3, CC BY 4.0.
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

export const NormalizedHealthFacility = z.object({
  id: z.string().describe("Stable facility id (fixture id, or the source's global/object id)"),
  name: z.string().describe("Facility name"),
  category: z
    .string()
    .nullable()
    .describe("Facility category/level, e.g. hospital / clinic / phc (null when the source omits it)"),
  ownership: z
    .string()
    .nullable()
    .describe("Ownership, e.g. public / private (null when the source omits it)"),
  state: z.string().nullable().describe("Nigerian state, e.g. Lagos"),
  lga: z.string().nullable().describe("Local Government Area, e.g. Eti-Osa"),
  lat: z.number().describe("Latitude (WGS84)"),
  lng: z.number().describe("Longitude (WGS84)"),
  distanceKm: z
    .number()
    .nullable()
    .optional()
    .describe("Great-circle distance from the query point in km (only on findNear results)"),
  ...Provenance,
});
export type NormalizedHealthFacility = z.infer<typeof NormalizedHealthFacility>;

export interface HealthFacilityProvider {
  readonly name: string;
  findNear(lat: number, lng: number, radiusKm: number, limit: number): Promise<NormalizedHealthFacility[]>;
  getFacility(id: string): Promise<NormalizedHealthFacility>;
}
