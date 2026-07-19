# Nigeria Admin Divisions MCP

> Nigeria's 36 states + the FCT and all 774 Local Government Areas, exposed to AI agents as MCP tools — fully offline.

**Status:** 📦 **Offline — bundled dataset, no API key, no network**
**Package:** `@braynexservices/nigeria-mcp-admin-divisions` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see [`NOTICE`](./NOTICE)).

---

## What it does
Returns Nigeria's administrative divisions — the **36 states + the FCT (37 in total)** with a per-state Local Government Area count, and the **full LGA list for any state**. The whole dataset (37 divisions, **774 LGAs**) is **compiled into the package**: every lookup is served locally. **No network call, no API key, ever.** Public reference data — no PII. Each response carries `source: "static"` and a fresh `retrievedAt`.

## Tools

### `list_states`
Lists every state (36 + FCT) with its LGA count. Takes no arguments.

| Param | Required | Notes |
|---|---|---|
| — | — | no arguments |

**Example:**
```jsonc
// → list_states({})
"Abia (17 LGAs)\nAdamawa (21 LGAs)\nAkwa Ibom (31 LGAs)\n…\nFCT (6 LGAs)"
// structuredContent: {
//   count: 37,                                    // 36 states + FCT
//   states: [{ state:"Abia", lgaCount:17 }, …],   // 37 rows
//   source: "static", retrievedAt
// }
```

### `get_lgas`
Lists the Local Government Areas of one state. Matching is **case-insensitive**; use `FCT` (or `Abuja`) for the Federal Capital Territory.

| Param | Required | Notes |
|---|---|---|
| `state` | ✅ | state name, e.g. `Lagos` or `FCT` (case-insensitive; min 2 chars) |

**Example:**
```jsonc
// → get_lgas({ "state": "Lagos" })
"Lagos — 20 LGAs: Agege, Ajeromi/Ifelodun, Alimosho, …, Eti-Osa, …, Surulere"
// structuredContent: {
//   state: "Lagos",
//   lgas: ["Agege", "Ajeromi/Ifelodun", …, "Eti-Osa", …, "Surulere"],  // 20 items
//   source: "static", retrievedAt
// }

// → get_lgas({ "state": "Atlantis" })
// isError: true — "State \"Atlantis\" not found. Use list_states for the 37 valid names (36 states + FCT)."
```

> An unknown state returns an **actionable error** — it suggests close spelling matches where it can, and always points back to `list_states` for the 37 valid names.

## Configuration — `ADMIN_DIVISIONS_PROVIDER`

| Value | Behaviour |
|---|---|
| `static` *(default — and the only provider)* | Offline. Serves the states/LGAs dataset **bundled into the package**. No network, no key. |

There is nothing to configure. **No API key is required — ever** — and no network is used. The env var exists only so a future API-backed source could be slotted in without changing callers.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke -w @braynexservices/nigeria-mcp-admin-divisions        # end-to-end (in-memory MCP client↔server)

npm run start:stdio -w @braynexservices/nigeria-mcp-admin-divisions  # serve over stdio
```

> There is no separate "live" mode: the bundled dataset **is** the source. `npm run smoke:live` exists for parity across lanes but simply re-runs the same offline provider and prints its counts — no network is ever hit.

**MCP Inspector** (interactive GUI):
```bash
npx @modelcontextprotocol/inspector node lanes/admin-divisions/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-admin-divisions": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-admin-divisions"]
    }
  }
}
```
No `env` block is needed — the lane is offline. Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/admin-divisions/dist/stdio.js"]`. Then ask, e.g., *"How many LGAs are in Kano?"* or *"List the local governments in Lagos."*

## Limits & notes
- **Fully offline.** The dataset (37 divisions, 774 LGAs) is compiled into the package — no network call and no API key at any point. Every row is stamped `source: "static"` with a fresh `retrievedAt`.
- **Reference data, not a live registry.** Counts reflect a compiled dataset snapshot (extracted 2026-07-15), not a real-time government feed.
- **State → LGA-name mapping only.** Wards and coordinates from the upstream GeoJSON are intentionally dropped; this lane carries state names, their LGA names, and counts.
- **Matching:** case-insensitive; `FCT` and `Abuja` both resolve to the Federal Capital Territory.
- **Data:** compiled from [`temikeezy/nigeria-geojson-data`](https://github.com/temikeezy/nigeria-geojson-data) (MIT, © 2025 Temi). The full upstream MIT permission notice ships with the package in [`NOTICE`](./NOTICE). Three spellings were normalized on extraction: *"Federal Capital Territory"* → *"FCT"*, *"Nassarawa"* → the official *"Nasarawa"*, and *"Badagary"* → the official *"Badagry"*.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: an in-memory MCP client↔server smoke exercises **both tools plus the not-found path** and asserts the dataset invariants on every run — 37 divisions (36 + FCT), 774 LGAs total, and Lagos includes "Eti-Osa".
