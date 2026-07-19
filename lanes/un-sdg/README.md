# Nigeria UN SDG MCP

> Nigeria's UN Sustainable Development Goals indicators (poverty, health, energy & water access, education), exposed to AI agents as MCP tools.

**Status:** 🌐 **LIVE + free (no API key)**
**Package:** `@braynexservices/nigeria-mcp-un-sdg` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

---

## What it does
Returns a UN SDG indicator series for **Nigeria** — one national headline value per year, sorted ascending. Data is pulled live from the **UN SDG Global Database** (UN Statistics Division, area 566 = Nigeria), **keyless**. You pass a friendly alias (`extreme_poverty`, `under5_mortality`, …) or a raw UN SDG series code (`SI_POV_DAY1`). Public statistical data — no PII, no key.

## Tool

### `get_sdg_indicator`
| Param | Required | Notes |
|---|---|---|
| `series` | ✔ | a friendly alias (below) **or** a raw UN SDG series code (e.g. `SI_POV_DAY1`) |
| `start_year` | — | integer ≥ 2000 — drop points before this year |
| `end_year` | — | integer ≤ 2035 — drop points after this year |

**Aliases** (each resolves to a UN SDG series code):

| Alias | Series code | Measures | SDG goal |
|---|---|---|---|
| `extreme_poverty` | `SI_POV_DAY1` | Population below the international poverty line (%) | 1 |
| `under5_mortality` | `SH_DYN_MORT` | Under-5 mortality rate (deaths per 1,000 live births) | 3 |
| `electricity_access` | `EG_ACS_ELEC` | Population with access to electricity (%) | 7 |
| `water_access` | `SP_ACS_BSRVH2O` | Population using basic drinking-water services (%) | 6 |
| `primary_school_completion` | `SE_TOT_CPLR` | Primary-school completion rate (%) | 4 |

Anything that isn't a known alias is treated as a raw series code and upper-cased before the lookup.

**Example:**
```jsonc
// → get_sdg_indicator({ "series": "extreme_poverty" })
"Proportion of population below international poverty line (%) — Nigeria: 30.9 in 2020 (4 points)"
// structuredContent:
// {
//   seriesCode: "SI_POV_DAY1",
//   description: "Proportion of population below international poverty line (%)",
//   goal: "1",
//   country: "Nigeria (566)",
//   points: [ { year:2010, value:38.5 }, … { year:2020, value:30.9 } ],
//   source: "mock", retrievedAt: "2026-07-18T…Z"
// }

// → get_sdg_indicator({ "series": "SH_DYN_MORT", "start_year": 2010, "end_year": 2020 })
// raw series code + year window
```

> The `points` values above are the deterministic **mock** figures (the offline default). Set `SDG_PROVIDER=unsdg` for live UN numbers; the shape is identical.

## Configuration — `SDG_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures (poverty + electricity access) — for dev/eval, zero network |
| `unsdg` | **Live** UN SDG Global Database API (keyless). Set this for real data. |

No API key required.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-un-sdg   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-un-sdg   # live (real UN API)

SDG_PROVIDER=unsdg npm run start:stdio -w @braynexservices/nigeria-mcp-un-sdg   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
SDG_PROVIDER=unsdg npx @modelcontextprotocol/inspector node lanes/un-sdg/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-un-sdg": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-un-sdg"],
      "env": { "SDG_PROVIDER": "unsdg" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/un-sdg/dist/stdio.js"]`. Then ask, e.g., *"What's Nigeria's extreme poverty rate over time?"*

## Limits & notes
- **National headline only.** A UN SDG series reports many rows per year, split across sex / location / age / wealth / education dimensions. This adapter returns the **national (all-Nigeria) headline value** for each year — it selects the total/aggregate row across those dimensions. For series reported *by* education level (primary-school completion), it selects the **primary-education** row, since that level *is* the indicator rather than a total. Constant dimensions that never vary (e.g. under-5 mortality's `Age = <5Y`) are treated as part of the indicator, not a disaggregation.
- **No disaggregated stand-ins.** It pages through the full result set (`totalElements`), so dense series are never truncated to the first page. If **no unambiguous national row** exists for a series, it **errors** rather than return a disaggregated (e.g. single-sex) figure.
- **Nigeria-only:** every request is scoped to M49 area **566**. `country` is always `"Nigeria (566)"`.
- **Missing years:** a year present in the source but without a numeric national value is returned with `value: null` (present but unresolved), not dropped silently.
- **Source:** live records carry `source: "unsdg"` and a fresh `retrievedAt` per call; the offline default carries `source: "mock"`.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke + `smoke:live` against the real UN SDG API, plus independent code-review (all five aliased series verified live against area 566, national-row selection confirmed against known disaggregated series).
</content>
</invoke>
