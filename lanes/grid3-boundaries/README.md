# Nigeria GRID3 Boundaries MCP

> Nigerian administrative boundaries (state / LGA / ward) and point reverse-geocoding, exposed to AI agents as MCP tools.

**Status:** 🌐 **LIVE + free (no API key)**
**Package:** `@braynexservices/nigeria-mcp-grid3-boundaries` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

---

## What it does
Answers two questions about Nigerian administrative geography as MCP tools: *where is a named boundary* and *which admin areas contain this point*. Coverage is the three official levels — **state (ADM1), LGA (ADM2), ward (ADM3)**. Data comes from **GRID3** (CIESIN, Columbia University + WorldPop + Nigerian government partners) public **ArcGIS feature services** — CC BY 4.0, keyless. Public geodata — no PII, no key.

## Tools

### `get_boundary`
Look up a Nigerian administrative boundary by name. Returns the **centroid + bounding box + attribution — not the full polygon**.

| Param | Required | Notes |
|---|---|---|
| `level` | ✓ | administrative level: `state`, `lga` or `ward` |
| `name` | ✓ | boundary name, e.g. `Lagos` or `Eti-Osa` (2–120 chars) |

**Example:**
```jsonc
// → get_boundary({ "level": "state", "name": "Lagos" })
"Lagos (state) — centroid 6.5341, 3.5337"
// structuredContent: {
//   name: "Lagos", level: "state",
//   centroid: { lat: 6.5341, lng: 3.5337 },
//   bbox: [2.6988, 6.3678, 4.3686, 6.7004],   // [minLng, minLat, maxLng, maxLat] (WGS84)
//   attribution: "GRID3, CC BY 4.0",
//   source: "grid3", retrievedAt
// }
```

### `point_in_admin`
Reverse-geocode a WGS84 point to the state, LGA and (where mapped) ward that contain it — the primitive other lookups compose on.

| Param | Required | Notes |
|---|---|---|
| `lat` | ✓ | latitude (WGS84); Nigeria spans ~4–14 °N |
| `lng` | ✓ | longitude (WGS84); Nigeria spans ~2–15 °E |

**Example:**
```jsonc
// → point_in_admin({ "lat": 6.43, "lng": 3.42 })
"(6.43, 3.42) → Lagos state, Eti Osa LGA, Victoria Island ward"
// structuredContent: { state:"Lagos", lga:"Eti Osa", ward:"Victoria Island", source:"grid3", retrievedAt }
```

> **`get_boundary`** returns the centroid, bounding box and attribution — never the full polygon (polygons are too large for tool output). **`point_in_admin`** returns only the containing state / LGA / ward (no geometry); `ward` is `null` where a point falls outside GRID3 ward coverage, and `state` + `lga` are still returned.

## Configuration — `BOUNDARY_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures (state / LGA / ward + point lookups) — for dev/eval |
| `grid3` | **Live** queries against GRID3's public ArcGIS feature services (keyless). Set this for real data. |

No API key required. Service layer URLs are env-overridable for newer GRID3 releases: **`GRID3_STATE_URL` / `GRID3_LGA_URL` / `GRID3_WARD_URL`** (layer URL, no trailing `/query`).

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-grid3-boundaries   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-grid3-boundaries   # live (real GRID3 services)

BOUNDARY_PROVIDER=grid3 npm run start:stdio -w @braynexservices/nigeria-mcp-grid3-boundaries   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
BOUNDARY_PROVIDER=grid3 npx @modelcontextprotocol/inspector node lanes/grid3-boundaries/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-grid3-boundaries": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-grid3-boundaries"],
      "env": { "BOUNDARY_PROVIDER": "grid3" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/grid3-boundaries/dist/stdio.js"]`. Then ask, e.g., *"Which LGA and ward is 6.43, 3.42 in?"* or *"What's the bounding box of Lagos State?"*

## Limits & notes
- **Centroid + bbox, not the polygon.** `get_boundary` returns the boundary's centre point and bounding box — the full polygon geometry is never pulled (too large for tool output).
- **Repeated names resolve to one feature.** Nigerian LGA/ward names recur across states (e.g. "Surulere" in Lagos and Oyo); when a name matches more than one boundary, the tool resolves to **one specific matching feature** and scopes the extent to that feature (not a nationwide union of every same-named boundary).
- **Name spelling.** GRID3 spells some names without hyphens (e.g. `Eti Osa`); lookups automatically retry hyphen/space variants. Match official Nigerian admin names for best results.
- **Point outside Nigeria** (roughly lat 4–14, lng 2–15) returns an actionable not-found rather than a guess.
- **Resilience.** Fetch timeout with backoff-retry on transient failures; on a hard failure it returns an actionable error (override `GRID3_*_URL` if a service layer moved, or set `BOUNDARY_PROVIDER=mock`).
- **Source:** results carry `source: "grid3"` and a fresh `retrievedAt` per call.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke + `smoke:live` against the live GRID3 services (state / LGA / ward lookups + point-in-admin verified), independent code-review.
