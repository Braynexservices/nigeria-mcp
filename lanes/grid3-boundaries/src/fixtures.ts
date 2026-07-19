/**
 * Mock boundary fixtures — deterministic data so the lane and its own tests run with
 * zero signup. Extents are real GRID3-derived values (Lagos state bbox comes from a live
 * NGA_State_Boundaries_V2 extent query); ward/LGA boxes are plausible simplifications.
 *
 * Canonical fixtures the lane tests depend on:
 *   - state  "Lagos"           centroid (6.5244, 3.3792)
 *   - lga    "Eti-Osa"         parent state "Lagos"
 *   - point  (lat 6.43, lng 3.42) -> { state: "Lagos", lga: "Eti-Osa", ward: "Victoria Island" }
 */
import { type BoundaryLevel } from "./schema.js";

export interface FixtureBoundary {
  name: string;
  level: BoundaryLevel;
  /** Containing state, for sub-state levels. */
  parentState?: string;
  /** Containing LGA, for wards. */
  parentLga?: string;
  centroid: { lat: number; lng: number };
  /** [minLng, minLat, maxLng, maxLat] (WGS84). */
  bbox: [number, number, number, number];
}

export interface FixturePointAdmin {
  /** Point falls inside this box -> resolves to the admin names below. [minLng, minLat, maxLng, maxLat]. */
  bbox: [number, number, number, number];
  state: string;
  lga: string;
  ward: string | null;
}

export const BOUNDARIES: FixtureBoundary[] = [
  {
    name: "Lagos",
    level: "state",
    centroid: { lat: 6.5244, lng: 3.3792 },
    bbox: [2.6988, 6.3678, 4.3686, 6.7004],
  },
  {
    name: "Eti-Osa",
    level: "lga",
    parentState: "Lagos",
    centroid: { lat: 6.4589, lng: 3.4711 },
    bbox: [3.3944, 6.3966, 3.7079, 6.4989],
  },
  {
    name: "Victoria Island",
    level: "ward",
    parentState: "Lagos",
    parentLga: "Eti-Osa",
    centroid: { lat: 6.4318, lng: 3.4218 },
    bbox: [3.3944, 6.4133, 3.4441, 6.4467],
  },
];

export const POINT_ADMIN: FixturePointAdmin[] = [
  // Victoria Island box — contains the canonical test point (lat 6.43, lng 3.42).
  {
    bbox: [3.3944, 6.4133, 3.4441, 6.4467],
    state: "Lagos",
    lga: "Eti-Osa",
    ward: "Victoria Island",
  },
];
