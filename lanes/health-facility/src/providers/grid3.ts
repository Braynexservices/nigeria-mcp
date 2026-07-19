/**
 * Live health facility adapter — GRID3 Nigeria Health Facilities v2.0 (~51k facilities,
 * incorporating the Nigeria Health Facility Registry). FREE + KEYLESS ArcGIS feature
 * service. Data licence: GRID3, CC BY 4.0 — attribution is carried in every record's
 * provenance `source` field.
 *
 * VERIFIED 2026-07-15 (two live probes):
 *   Layer:  https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services/GRID3_NGA_health_facilities_v2_0/FeatureServer/0
 *           geometryType=esriGeometryPoint · capabilities "Query,Extract" ·
 *           supportsQueryWithDistance=true · maxRecordCount=2000
 *   Query:  .../FeatureServer/0/query?f=json&where=1=1&geometry=3.40,6.45
 *           &geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects
 *           &distance=5000&units=esriSRUnit_Meter&outFields=*&outSR=4326&resultRecordCount=3
 *           -> 3 features around Lagos Island, e.g. "Runsewe Hospital Specialist".
 *
 * Verified response fields (attributes): OBJECTID, globalid (uuid string), nhfr_uid,
 * nhfr_facility_code, country, iso, state, lga, lga_name_disagreement, ward,
 * ward_name_disagreement, facility_name, facility_name_source, ownership (Public/Private),
 * ownership_type, facility_level (Primary/Secondary/...), facility_level_option
 * (e.g. "Primary Health Center"), latitude, longitude, geocoordinates_source, last_updated.
 * Geometry: { x: lng, y: lat } in WGS84 when outSR=4326.
 *
 * findNear caveat: ArcGIS returns matches within the radius in server order (OBJECTID asc, NOT
 * sorted by proximity), so we must fetch the in-radius set, compute haversine distance
 * client-side, sort nearest-first, THEN take `limit`. Capping the server query at `limit`
 * (as an earlier version did) truncates before the sort and returns an arbitrary subset, not
 * the true nearest — so we over-fetch up to OVERFETCH_CAP and slice after sorting. For a radius
 * so dense it exceeds the cap, the result is the nearest within the first OVERFETCH_CAP the
 * service returns (still vastly better than pre-sort truncation, and realistic city-scale
 * radii return far fewer).
 */
import { fetchJson, providerKey, stamp, notFound, ToolError } from "@braynexservices/nigeria-mcp-core";
import { type HealthFacilityProvider, type NormalizedHealthFacility } from "../schema.js";
import { haversineKm, roundKm } from "../geo.js";

const DEFAULT_QUERY_URL =
  "https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services/GRID3_NGA_health_facilities_v2_0/FeatureServer/0/query";
const SOURCE = "grid3 (GRID3 NGA Health Facilities v2.0, CC BY 4.0)";
const HINT = "Retry shortly, or set HEALTH_PROVIDER=mock for offline fixtures.";
// Over-fetch ceiling for findNear: pull up to this many in-radius facilities so the client-side
// distance sort has the full candidate set before slicing to `limit`. Bounded by the layer's
// maxRecordCount (2000); 500 covers realistic city-scale radii with wide headroom over limit<=50.
const OVERFETCH_CAP = 500;

interface ArcgisFeature {
  attributes?: Record<string, unknown>;
  geometry?: { x?: number; y?: number };
}

interface ArcgisQueryResponse {
  features?: ArcgisFeature[];
  error?: { code?: number; message?: string; details?: string[] };
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export class Grid3HealthFacilityProvider implements HealthFacilityProvider {
  readonly name = "grid3";

  constructor(
    /** ArcGIS layer /query endpoint. Override via GRID3_HEALTH_URL if GRID3 rehosts. */
    private readonly queryUrl = providerKey("GRID3_HEALTH_URL", DEFAULT_QUERY_URL),
  ) {}

  async findNear(lat: number, lng: number, radiusKm: number, limit: number): Promise<NormalizedHealthFacility[]> {
    const features = await this.query({
      where: "1=1",
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      distance: String(Math.round(radiusKm * 1000)),
      units: "esriSRUnit_Meter",
      resultRecordCount: String(OVERFETCH_CAP),
    });
    return features
      .map((f) => this.normalize(f, lat, lng))
      .filter((f): f is NormalizedHealthFacility => f !== null)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, limit);
  }

  async getFacility(id: string): Promise<NormalizedHealthFacility> {
    const clean = id.trim().replace(/[{}]/g, "");
    let where: string;
    if (/^\d+$/.test(clean)) {
      where = `OBJECTID = ${clean}`;
    } else if (/^[0-9a-fA-F-]+$/.test(clean)) {
      // globalid is a plain uuid string in this layer (esriFieldTypeString).
      where = `globalid = '${clean}'`;
    } else {
      notFound(`Facility ${id}`, "GRID3 ids are uuid globalids or numeric OBJECTIDs — discover them via find_facilities_near.");
    }
    const features = await this.query({ where, resultRecordCount: "1" });
    const rec = features.length ? this.normalize(features[0], null, null) : null;
    if (!rec) notFound(`Facility ${id}`, "No GRID3 record matched that id. Discover ids via find_facilities_near.");
    return rec;
  }

  private async query(params: Record<string, string>): Promise<ArcgisFeature[]> {
    const search = new URLSearchParams({
      f: "json",
      outFields: "*",
      outSR: "4326",
      returnGeometry: "true",
      ...params,
    });
    const { res, body } = await fetchJson(
      `${this.queryUrl}?${search.toString()}`,
      { headers: { Accept: "application/json" } },
      { service: "GRID3", fallbackHint: "set HEALTH_PROVIDER=mock" },
    );
    if (!res.ok) {
      throw new ToolError(`GRID3 request failed (HTTP ${res.status}).`, HINT);
    }
    if (body === null) {
      throw new ToolError("GRID3 returned a malformed (non-JSON) response.", HINT);
    }
    const parsed = body as ArcgisQueryResponse;
    // ArcGIS reports query errors inside a 200 body — surface them, don't launder into "no results".
    if (parsed.error) {
      throw new ToolError(
        `GRID3 rejected the query (${parsed.error.code ?? "?"}: ${parsed.error.message ?? "unknown error"}).`,
        HINT,
      );
    }
    return parsed.features ?? [];
  }

  /** Map one ArcGIS feature onto the normalized schema; null when it has no usable coordinates. */
  private normalize(f: ArcgisFeature, originLat: number | null, originLng: number | null): NormalizedHealthFacility | null {
    const a = f.attributes ?? {};
    const lat = num(a.latitude) ?? num(f.geometry?.y);
    const lng = num(a.longitude) ?? num(f.geometry?.x);
    if (lat === null || lng === null) return null;
    const objectId = num(a.OBJECTID);
    return stamp(
      {
        id: str(a.globalid) ?? (objectId !== null ? String(objectId) : `${lat},${lng}`),
        name: str(a.facility_name) ?? "UNKNOWN FACILITY",
        category: str(a.facility_level_option) ?? str(a.facility_level),
        ownership: str(a.ownership),
        state: str(a.state),
        lga: str(a.lga),
        lat,
        lng,
        distanceKm:
          originLat !== null && originLng !== null ? roundKm(haversineKm(originLat, originLng, lat, lng)) : null,
      },
      SOURCE,
    );
  }
}
