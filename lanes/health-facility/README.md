# Nigeria Health Facility MCP

> Nearest Nigerian health facilities (hospitals, clinics, PHCs) to a map point, exposed to AI agents as MCP tools.

**Status:** 🌐 **LIVE + free (no API key)**
**Package:** `@braynexservices/nigeria-mcp-health-facility` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

---

## What it does
Finds Nigerian health facilities near a WGS84 (lat/lng) point and returns them **sorted by distance**, or fetches one facility by id. Data comes from **GRID3 NGA Health Facilities v2.0** (~51k facilities, incorporating the Nigeria Health Facility Registry) — a free, keyless public ArcGIS feature service, licensed **CC BY 4.0**. Public infrastructure data — no PII, no key.

## Tools

### `find_facilities_near`
| Param | Required | Notes |
|---|---|---|
| `lat` | ✅ | Latitude, WGS84 (4–14 for Nigeria) |
| `lng` | ✅ | Longitude, WGS84 (2–15 for Nigeria) |
| `radius_km` | — | Search radius in km (default `10`, max `100`) |
| `limit` | — | Max results (default `10`, max `50`) |

Returns facilities within the radius, **sorted nearest-first**, each carrying a `distanceKm` (great-circle distance from the query point).

**Example:**
```jsonc
// → find_facilities_near({ "lat": 6.44, "lng": 3.41, "radius_km": 10, "limit": 10 })   // live GRID3 provider (HEALTH_PROVIDER=grid3)
"7 facility(ies) within 10 km — nearest: Runsewe Hospital Specialist (1.83 km)"
// structuredContent.facilities: [
//   { id, name:"Runsewe Hospital Specialist", category:"Primary Health Center",
//     ownership:"Private", state:"Lagos", lga:"Lagos Island",
//     lat, lng, distanceKm:1.83, source:"grid3 (GRID3 NGA Health Facilities v2.0, CC BY 4.0)", retrievedAt },
//   ...
// ]
// structuredContent.count: 7
```

### `get_facility`
| Param | Required | Notes |
|---|---|---|
| `id` | ✅ | Facility id as returned by `find_facilities_near` — a uuid `globalid` or numeric `OBJECTID` under the live provider, or a fixture id like `HF001` under the default mock |

**Example:**
```jsonc
// → get_facility({ "id": "HF001" })   // default mock provider ("HF001" is a mock fixture id)
"Island Maternity Hospital — hospital in Eti-Osa, Lagos"
// structuredContent: { id, name, category, ownership, state, lga, lat, lng, distanceKm:null, source, retrievedAt }
```

> **`distanceKm` is `null` on `get_facility`** — distance only makes sense relative to a query point, so it is populated **only** on `find_facilities_near` results, never on a direct id lookup.

## Configuration — `HEALTH_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures — for dev/eval |
| `grid3` | **Live** data from the GRID3 NGA Health Facilities ArcGIS service (keyless). Set this for real data. |

No API key required. Override the ArcGIS layer endpoint via **`GRID3_HEALTH_URL`** (only needed if GRID3 rehosts the service).

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-health-facility   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-health-facility   # live (real API)

HEALTH_PROVIDER=grid3 npm run start:stdio -w @braynexservices/nigeria-mcp-health-facility   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
HEALTH_PROVIDER=grid3 npx @modelcontextprotocol/inspector node lanes/health-facility/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-health-facility": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-health-facility"],
      "env": { "HEALTH_PROVIDER": "grid3" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/health-facility/dist/stdio.js"]`. Then ask, e.g., *"Find the nearest hospitals to Lagos Island."*

## Limits & notes
- **Nearest is exact, not approximate.** ArcGIS returns in-radius matches in server order (by `OBJECTID`), not by proximity — so `find_facilities_near` over-fetches the in-radius set, computes great-circle (**haversine**) distance client-side, sorts nearest-first, then slices to `limit`. You get the *true* nearest facilities, each with a real `distanceKm`.
- **Very dense radius:** the over-fetch is bounded by an internal cap, so for a radius dense enough to exceed it, the result is the nearest facilities within that cap (realistic city-scale radii return far fewer, so this is not hit in practice).
- **`get_facility` distance is `null`** — a direct id lookup has no origin point to measure from.
- **Nigeria only:** `lat`/`lng` are validated to Nigeria's bounding box (lat 4–14, lng 2–15).
- **Source:** every record carries `source: "grid3 (GRID3 NGA Health Facilities v2.0, CC BY 4.0)"` and a fresh `retrievedAt` per call — attribution travels with the data.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke + `smoke:live` against the live GRID3 ArcGIS service (two live probes verified 2026-07-15), independent code-review of the distance-sort path, cached.
