/**
 * Live GRID3 boundary adapter — FREE, KEYLESS. Queries the GRID3 Nigeria (CIESIN Columbia /
 * WorldPop + Nigerian government partners) hosted ArcGIS feature services on ArcGIS Online
 * (org BU6Aadhn6tbBEdyk, owner mlukang_GRID3). Public geodata, CC BY 4.0, no API key, no PII.
 *
 * Services VERIFIED LIVE 2026-07-15 (all support Query; maxRecordCount 2000; WGS84):
 *   state (ADM1): https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services/NGA_State_Boundaries_V2/FeatureServer/0
 *                 item c41532b720504f4799fe20438b7e3b7f "GRID3 NGA - Operational State Boundaries"
 *   lga   (ADM2): https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services/NGA_LGA_Boundaries_2/FeatureServer/0
 *                 item 2bb616a49ee84f409427cc2143787113 "GRID3 NGA - Operational LGA Boundaries"
 *   ward  (ADM3): https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services/NGA_Ward_Boundaries/FeatureServer/0
 *                 item 0824aded5f5a4d39b10871c667aa8ccf "GRID3 NGA - Operational Wards v1.0" (nationwide)
 *
 * Probe transcripts (real requests, 2026-07-15):
 *   1) .../NGA_State_Boundaries_V2/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&resultRecordCount=1&f=json
 *      -> features[0].attributes = { statename: "Cross River", statecode: "CR", capcity: "Calabar", geozone: "SSZ", ... }
 *   2) .../NGA_Ward_Boundaries/FeatureServer/0/query?geometry=3.42,6.43&geometryType=esriGeometryPoint&inSR=4326
 *        &spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json
 *      -> 1 feature: { wardname: "Victoria Island", wardcode: "LASEOA20", lganame: "Eti Osa", statename: "Lagos", ... }
 *   3) .../NGA_LGA_Boundaries_2/FeatureServer/0/query?where=UPPER(lganame)='ETI OSA'&outFields=*&returnGeometry=false&f=json
 *      -> 1 feature: { lganame: "Eti Osa", lgacode: 25008, statename: "Lagos", statecode: "LA", ... }
 *   4) .../NGA_State_Boundaries_V2/FeatureServer/0/query?where=UPPER(statename)='LAGOS'&returnExtentOnly=true&f=json
 *      -> extent { xmin: 2.6988..., ymin: 6.3678..., xmax: 4.3686..., ymax: 6.7004... }, spatialReference wkid 4326
 *
 * Name fields: state = statename, lga = lganame, ward = wardname (GRID3 spells some names
 * without hyphens, e.g. "Eti Osa" — lookups retry hyphen/space variants).
 *
 * Boundary lookups run two requests: attributes (returnGeometry=false) + extent
 * (returnExtentOnly=true) — full polygons are never pulled (too large for tool output);
 * the centroid is the bbox midpoint. Point lookups hit the ward layer once (its record
 * carries state + lga + ward) and fall back to the LGA layer (ward: null) off ward coverage.
 *
 * Service URLs are env-overridable for newer GRID3 releases:
 *   GRID3_STATE_URL / GRID3_LGA_URL / GRID3_WARD_URL (layer URL, no trailing /query).
 */
import { fetchJson, providerKey, stamp, notFound, ToolError } from "@braynexservices/nigeria-mcp-core";
import {
  type BoundaryLevel,
  type BoundaryProvider,
  type NormalizedBoundary,
  type NormalizedPointAdmin,
} from "../schema.js";

const ARCGIS_ORG = "https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services";
const DEFAULT_STATE_URL = `${ARCGIS_ORG}/NGA_State_Boundaries_V2/FeatureServer/0`;
const DEFAULT_LGA_URL = `${ARCGIS_ORG}/NGA_LGA_Boundaries_2/FeatureServer/0`;
const DEFAULT_WARD_URL = `${ARCGIS_ORG}/NGA_Ward_Boundaries/FeatureServer/0`;

const ATTRIBUTION = "GRID3, CC BY 4.0";
const FALLBACK_HINT = "set BOUNDARY_PROVIDER=mock";

interface ArcGisFeature {
  attributes?: Record<string, unknown>;
}

interface ArcGisQueryResponse {
  error?: { code?: number; message?: string };
  objectIdFieldName?: string;
  features?: ArcGisFeature[];
  extent?: { xmin?: number; ymin?: number; xmax?: number; ymax?: number };
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Escape a value for an ArcGIS SQL where clause (single quotes double up). */
const sqlEscape = (s: string): string => s.replace(/'/g, "''");

export class Grid3BoundaryProvider implements BoundaryProvider {
  readonly name = "grid3";

  private readonly layers: Record<BoundaryLevel, { url: string; nameField: string }>;

  constructor(
    stateUrl = providerKey("GRID3_STATE_URL", DEFAULT_STATE_URL),
    lgaUrl = providerKey("GRID3_LGA_URL", DEFAULT_LGA_URL),
    wardUrl = providerKey("GRID3_WARD_URL", DEFAULT_WARD_URL),
  ) {
    this.layers = {
      state: { url: stateUrl, nameField: "statename" },
      lga: { url: lgaUrl, nameField: "lganame" },
      ward: { url: wardUrl, nameField: "wardname" },
    };
  }

  async getBoundary(level: BoundaryLevel, name: string): Promise<NormalizedBoundary> {
    const layer = this.layers[level];
    // GRID3 spells some names without hyphens ("Eti Osa"); try the variants in order.
    const wanted = name.trim();
    const candidates = [...new Set([wanted, wanted.replace(/-/g, " "), wanted.replace(/\s+/g, "-")])];

    for (const candidate of candidates) {
      const where = `UPPER(${layer.nameField})='${sqlEscape(candidate.toUpperCase())}'`;
      const attrsRes = await this.query(layer.url, {
        where,
        outFields: "*",
        returnGeometry: "false",
        resultRecordCount: "1",
      });
      const attrs = attrsRes.features?.[0]?.attributes;
      if (!attrs) continue;

      // Scope the extent to the ONE feature we took attributes from, by its object id — NOT the
      // name predicate. Nigerian LGA/ward names repeat across states (e.g. "Surulere" in Lagos
      // and Oyo); returnExtentOnly over the name where-clause would union every same-named
      // boundary nationwide and hand back a bbox/centroid spanning all of them.
      const oidField = attrsRes.objectIdFieldName;
      const oidValue = oidField ? attrs[oidField] : undefined;
      const extentWhere =
        oidField && typeof oidValue === "number" ? `${oidField}=${oidValue}` : where;
      const extentRes = await this.query(layer.url, { where: extentWhere, returnExtentOnly: "true" });
      const e = extentRes.extent;
      if (
        !e ||
        typeof e.xmin !== "number" ||
        typeof e.ymin !== "number" ||
        typeof e.xmax !== "number" ||
        typeof e.ymax !== "number"
      ) {
        throw new ToolError(
          `GRID3 returned no extent for ${level} "${candidate}".`,
          `Retry shortly, or ${FALLBACK_HINT}.`,
        );
      }
      return stamp(
        {
          name: str(attrs[layer.nameField]) ?? wanted,
          level,
          centroid: { lat: (e.ymin + e.ymax) / 2, lng: (e.xmin + e.xmax) / 2 },
          bbox: [e.xmin, e.ymin, e.xmax, e.ymax],
          attribution: ATTRIBUTION,
        },
        this.name,
      );
    }

    notFound(
      `${level} boundary "${wanted}" in GRID3`,
      "Check the spelling against official Nigerian admin names (e.g. 'Lagos', 'Eti Osa'), or try another level.",
    );
  }

  async pointInAdmin(lat: number, lng: number): Promise<NormalizedPointAdmin> {
    // One ward-layer hit carries all three names (statename + lganame + wardname).
    const ward = await this.pointQuery(this.layers.ward.url, lat, lng, "statename,lganame,wardname");
    if (ward) {
      const state = str(ward.statename);
      const lga = str(ward.lganame);
      if (state && lga) {
        return stamp({ state, lga, ward: str(ward.wardname) }, this.name);
      }
    }
    // Off ward coverage — fall back to the LGA layer (ward unknown).
    const lgaRec = await this.pointQuery(this.layers.lga.url, lat, lng, "statename,lganame");
    const state = str(lgaRec?.statename);
    const lga = str(lgaRec?.lganame);
    if (state && lga) {
      return stamp({ state, lga, ward: null }, this.name);
    }

    notFound(
      `Nigerian admin area containing point (${lat}, ${lng})`,
      "The point may fall outside Nigeria's boundaries — Nigeria spans roughly lat 4-14, lng 2-15.",
    );
  }

  /** Point-in-polygon query against one layer; returns the first feature's attributes or null. */
  private async pointQuery(
    layerUrl: string,
    lat: number,
    lng: number,
    outFields: string,
  ): Promise<Record<string, unknown> | null> {
    const res = await this.query(layerUrl, {
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields,
      returnGeometry: "false",
      resultRecordCount: "1",
    });
    return res.features?.[0]?.attributes ?? null;
  }

  private async query(layerUrl: string, params: Record<string, string>): Promise<ArcGisQueryResponse> {
    const search = new URLSearchParams({ f: "json", ...params });
    const { res, body } = await fetchJson(
      `${layerUrl}/query?${search.toString()}`,
      { headers: { Accept: "application/json" } },
      { service: "GRID3", fallbackHint: FALLBACK_HINT },
    );
    if (!res.ok) {
      throw new ToolError(
        `GRID3 request failed (HTTP ${res.status}).`,
        `Retry shortly, or ${FALLBACK_HINT}.`,
      );
    }
    const data = (body ?? {}) as ArcGisQueryResponse;
    // ArcGIS reports many failures as HTTP 200 + an error envelope.
    if (data.error) {
      throw new ToolError(
        `GRID3 rejected the query${data.error.message ? `: ${data.error.message}` : ""}.`,
        `The service layer may have changed — override GRID3_STATE_URL / GRID3_LGA_URL / GRID3_WARD_URL, or ${FALLBACK_HINT}.`,
      );
    }
    return data;
  }
}
