/**
 * Mock boundary provider — the default. Resolves names / points against deterministic
 * fixtures so the lane runs with zero signup. Swap via BOUNDARY_PROVIDER env.
 *
 * Public geodata only — no PII.
 */
import { stamp, notFound } from "@braynexservices/nigeria-mcp-core";
import {
  type BoundaryLevel,
  type BoundaryProvider,
  type NormalizedBoundary,
  type NormalizedPointAdmin,
} from "../schema.js";
import { BOUNDARIES, POINT_ADMIN } from "../fixtures.js";

/** Case-, space- and hyphen-insensitive name key ("Eti-Osa" == "eti osa"). */
const nameKey = (s: string): string => s.trim().toLowerCase().replace(/[\s_-]+/g, " ");

export class MockBoundaryProvider implements BoundaryProvider {
  readonly name = "mock";

  async getBoundary(level: BoundaryLevel, name: string): Promise<NormalizedBoundary> {
    const rec = BOUNDARIES.find((b) => b.level === level && nameKey(b.name) === nameKey(name));
    if (!rec) {
      notFound(
        `${level} boundary "${name}"`,
        "Mock data is limited — try 'Lagos' (state), 'Eti-Osa' (lga) or 'Victoria Island' (ward), or set BOUNDARY_PROVIDER=grid3 for live GRID3 lookups.",
      );
    }
    return stamp(
      {
        name: rec.name,
        level: rec.level,
        centroid: rec.centroid,
        bbox: [...rec.bbox],
        attribution: "GRID3, CC BY 4.0",
      },
      this.name,
    );
  }

  async pointInAdmin(lat: number, lng: number): Promise<NormalizedPointAdmin> {
    const hit = POINT_ADMIN.find(
      (a) => lng >= a.bbox[0] && lng <= a.bbox[2] && lat >= a.bbox[1] && lat <= a.bbox[3],
    );
    if (!hit) {
      notFound(
        `Admin area containing point (${lat}, ${lng})`,
        "Mock coverage is limited to Victoria Island, Lagos (try lat 6.43, lng 3.42), or set BOUNDARY_PROVIDER=grid3 for nationwide live coverage.",
      );
    }
    return stamp({ state: hit.state, lga: hit.lga, ward: hit.ward }, this.name);
  }
}
