/**
 * Lane-local contracts for Nigerian administrative boundaries (state / LGA / ward).
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Public geodata (GRID3, CC BY 4.0) — no PII. Boundary results deliberately carry only
 * centroid + bbox, never full polygon geometry (too large for tool output).
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

export const BoundaryLevel = z.enum(["state", "lga", "ward"]);
export type BoundaryLevel = z.infer<typeof BoundaryLevel>;

export const NormalizedBoundary = z.object({
  name: z.string().describe("Canonical boundary name as recorded by the source, e.g. 'Lagos'"),
  level: BoundaryLevel.describe("Administrative level: state (ADM1), lga (ADM2), ward (ADM3)"),
  centroid: z
    .object({
      lat: z.number().describe("Latitude (WGS84)"),
      lng: z.number().describe("Longitude (WGS84)"),
    })
    .describe("Representative centre point of the boundary"),
  bbox: z
    .array(z.number())
    .length(4)
    .describe("Bounding box [minLng, minLat, maxLng, maxLat] (WGS84)"),
  attribution: z.string().describe("Data licence attribution, e.g. 'GRID3, CC BY 4.0'"),
  ...Provenance,
});
export type NormalizedBoundary = z.infer<typeof NormalizedBoundary>;

export const NormalizedPointAdmin = z.object({
  state: z.string().describe("State (ADM1) containing the point"),
  lga: z.string().describe("Local Government Area (ADM2) containing the point"),
  ward: z.string().nullable().describe("Ward (ADM3) containing the point, where mapped"),
  ...Provenance,
});
export type NormalizedPointAdmin = z.infer<typeof NormalizedPointAdmin>;

export interface BoundaryProvider {
  readonly name: string;
  getBoundary(level: BoundaryLevel, name: string): Promise<NormalizedBoundary>;
  pointInAdmin(lat: number, lng: number): Promise<NormalizedPointAdmin>;
}
