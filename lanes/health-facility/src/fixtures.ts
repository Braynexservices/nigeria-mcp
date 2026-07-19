/**
 * Mock health facility fixtures — deterministic data so the lane and its own tests run
 * with zero signup. Synthetic records loosely modelled on real Nigerian facility types;
 * NOT sourced from GRID3/NHFR. HF001 is the canonical cross-lane demo facility.
 */
export interface FixtureFacility {
  id: string;
  name: string;
  category?: string;
  ownership?: string;
  state?: string;
  lga?: string;
  lat: number;
  lng: number;
}

export const FACILITIES: FixtureFacility[] = [
  {
    id: "HF001",
    name: "Island Maternity Hospital",
    category: "hospital",
    ownership: "public",
    state: "Lagos",
    lga: "Eti-Osa",
    lat: 6.45,
    lng: 3.4,
  },
  {
    id: "HF002",
    name: "Lekki Phase 1 Primary Health Centre",
    category: "phc",
    ownership: "public",
    state: "Lagos",
    lga: "Eti-Osa",
    lat: 6.4478,
    lng: 3.4723,
  },
  {
    id: "HF003",
    name: "Surulere Family Clinic",
    category: "clinic",
    ownership: "private",
    state: "Lagos",
    lga: "Surulere",
    lat: 6.4926,
    lng: 3.3559,
  },
  {
    id: "HF004",
    name: "Garki General Hospital",
    category: "hospital",
    ownership: "public",
    state: "FCT",
    lga: "Abuja Municipal",
    lat: 9.0292,
    lng: 7.4899,
  },
];
