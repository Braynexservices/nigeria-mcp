/**
 * Boundary MCP tools. Provider-agnostic — each calls the injected BoundaryProvider and
 * returns the normalized schema as structuredContent. Public geodata (GRID3, CC BY 4.0),
 * no PII.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import {
  BoundaryLevel,
  type BoundaryProvider,
  NormalizedBoundary,
  NormalizedPointAdmin,
} from "./schema.js";

export function boundaryTools(provider: BoundaryProvider): ToolDef[] {
  return [
    {
      name: "get_boundary",
      title: "Get Nigerian admin boundary",
      description:
        "Look up a Nigerian administrative boundary (state, LGA or ward) by name. Returns the centroid, " +
        "bounding box and attribution — not the full polygon. Example: { level: 'state', name: 'Lagos' }. " +
        "Data: GRID3, CC BY 4.0.",
      inputSchema: {
        level: BoundaryLevel.describe("Administrative level: state, lga or ward"),
        name: z.string().min(2).max(120).describe("Boundary name, e.g. 'Lagos' or 'Eti-Osa'"),
      },
      outputSchema: NormalizedBoundary.shape,
      handler: async (args) => {
        const b = await provider.getBoundary(args.level as BoundaryLevel, String(args.name));
        return {
          content: [
            {
              type: "text",
              text: `${b.name} (${b.level}) — centroid ${b.centroid.lat.toFixed(4)}, ${b.centroid.lng.toFixed(4)}`,
            },
          ],
          structuredContent: b,
        };
      },
    },
    {
      name: "point_in_admin",
      title: "Reverse-geocode a point to admin areas",
      description:
        "Resolve a WGS84 point to the Nigerian state, LGA and (where mapped) ward containing it — the " +
        "reverse-geocode primitive other lookups compose on. Example: { lat: 6.43, lng: 3.42 }. " +
        "Data: GRID3, CC BY 4.0.",
      inputSchema: {
        lat: z.number().min(4).max(14).describe("Latitude (WGS84), Nigeria is ~4-14°N"),
        lng: z.number().min(2).max(15).describe("Longitude (WGS84), Nigeria is ~2-15°E"),
      },
      outputSchema: NormalizedPointAdmin.shape,
      handler: async (args) => {
        const r = await provider.pointInAdmin(Number(args.lat), Number(args.lng));
        const ward = r.ward ? `, ${r.ward} ward` : "";
        return {
          content: [{ type: "text", text: `(${args.lat}, ${args.lng}) → ${r.state} state, ${r.lga} LGA${ward}` }],
          structuredContent: r,
        };
      },
    },
  ];
}
