/**
 * Mock health facility provider — the default. Resolves lookups against deterministic
 * fixtures so the lane runs with zero signup. findNear computes real haversine distances
 * and filters by radius (nearest first). Swap via HEALTH_PROVIDER env.
 */
import { stamp, notFound } from "@braynexservices/nigeria-mcp-core";
import { type HealthFacilityProvider, type NormalizedHealthFacility } from "../schema.js";
import { FACILITIES, type FixtureFacility } from "../fixtures.js";
import { haversineKm, roundKm } from "../geo.js";

export class MockHealthFacilityProvider implements HealthFacilityProvider {
  readonly name = "mock";

  async findNear(lat: number, lng: number, radiusKm: number, limit: number): Promise<NormalizedHealthFacility[]> {
    return FACILITIES.map((f) => ({ f, distanceKm: haversineKm(lat, lng, f.lat, f.lng) }))
      .filter((x) => x.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit)
      .map((x) => this.normalize(x.f, roundKm(x.distanceKm)));
  }

  async getFacility(id: string): Promise<NormalizedHealthFacility> {
    const rec = FACILITIES.find((f) => f.id === id.trim());
    if (!rec) notFound(`Facility ${id}`, "Check the facility id; mock data is limited. Try find_facilities_near first.");
    return this.normalize(rec, null);
  }

  private normalize(f: FixtureFacility, distanceKm: number | null): NormalizedHealthFacility {
    return stamp(
      {
        id: f.id,
        name: f.name,
        category: f.category ?? null,
        ownership: f.ownership ?? null,
        state: f.state ?? null,
        lga: f.lga ?? null,
        lat: f.lat,
        lng: f.lng,
        distanceKm,
      },
      this.name,
    );
  }
}
