/**
 * Health-facility MCP tools. Provider-agnostic — each calls the injected
 * HealthFacilityProvider and returns the normalized schema as structuredContent.
 * Public infrastructure data (GRID3 / NHFR, CC BY 4.0) — no PII.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import { type HealthFacilityProvider, NormalizedHealthFacility } from "./schema.js";

export function healthFacilityTools(provider: HealthFacilityProvider): ToolDef[] {
  return [
    {
      name: "find_facilities_near",
      title: "Find Nigerian health facilities near a point",
      description:
        "Find health facilities (hospitals, clinics, PHCs) near a WGS84 point, sorted by distance. " +
        "Example: { lat: 6.44, lng: 3.41, radius_km: 10, limit: 10 }. Data: GRID3 health facilities, CC BY 4.0.",
      inputSchema: {
        lat: z.number().min(4).max(14).describe("Latitude (WGS84)"),
        lng: z.number().min(2).max(15).describe("Longitude (WGS84)"),
        radius_km: z.number().positive().max(100).optional().describe("Search radius in km (default 10)"),
        limit: z.number().int().positive().max(50).optional().describe("Max results (default 10)"),
      },
      outputSchema: {
        facilities: z.array(NormalizedHealthFacility),
        count: z.number().int(),
      },
      handler: async (args) => {
        const radiusKm = args.radius_km === undefined ? 10 : Number(args.radius_km);
        const limit = args.limit === undefined ? 10 : Number(args.limit);
        const facilities = await provider.findNear(Number(args.lat), Number(args.lng), radiusKm, limit);
        const nearest = facilities[0];
        const text = facilities.length
          ? `${facilities.length} facility(ies) within ${radiusKm} km — nearest: ${nearest.name}${nearest.distanceKm != null ? ` (${nearest.distanceKm} km)` : ""}`
          : `No facilities within ${radiusKm} km of (${args.lat}, ${args.lng}).`;
        return {
          content: [{ type: "text", text }],
          structuredContent: { facilities, count: facilities.length },
        };
      },
    },
    {
      name: "get_facility",
      title: "Get a Nigerian health facility by id",
      description:
        "Fetch one health facility by its id (as returned by find_facilities_near). Example: { id: 'HF001' }.",
      inputSchema: {
        id: z.string().min(2).max(128).describe("Facility id"),
      },
      outputSchema: NormalizedHealthFacility.shape,
      handler: async (args) => {
        const f = await provider.getFacility(String(args.id));
        return {
          content: [{ type: "text", text: `${f.name} — ${f.category ?? "facility"} in ${f.lga ?? "?"}, ${f.state ?? "?"}` }],
          structuredContent: f,
        };
      },
    },
  ];
}
