# Nigeria IMF WEO MCP

> IMF World Economic Outlook series for Nigeria — GDP growth, inflation, debt, current account and more — exposed to AI agents as MCP tools.

**Status:** 🌐 **Free + keyless (no API key)**
**Package:** `@braynexservices/nigeria-mcp-imf-weo` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

---

## What it does
Returns an IMF **World Economic Outlook (WEO)** indicator series for Nigeria (`NGA`) — historical years plus IMF projection years. Data is fetched live from the **IMF DataMapper API** (free, keyless, public macro data — no PII, no signup) and cached ~6h. You ask by a friendly alias (e.g. `gdp_growth`) or a raw WEO code (e.g. `NGDP_RPCH`), optionally bounded by year.

## Tool

### `get_imf_projection`
| Param | Required | Notes |
|---|---|---|
| `indicator` | ✓ | alias (see below) or a raw IMF WEO code (e.g. `NGDP_RPCH`) |
| `start_year` | — | earliest year to include (integer, ≥ 1980) |
| `end_year` | — | latest year to include (integer, ≤ 2035) |

**Indicator aliases** (any raw WEO code also works directly):

| Alias | WEO code | Meaning |
|---|---|---|
| `gdp_growth` | `NGDP_RPCH` | Real GDP growth (annual % change) |
| `inflation` | `PCPIPCH` | Inflation, average consumer prices (annual % change) |
| `gdp_per_capita_usd` | `NGDPDPC` | GDP per capita, current prices (US dollars) |
| `current_account_gdp` | `BCA_NGDPD` | Current account balance (% of GDP) |
| `gov_debt_gdp` | `GGXWDG_NGDP` | General government gross debt (% of GDP) |
| `unemployment` | `LUR` | Unemployment rate (% of labor force) |

**Examples:**
```jsonc
// → get_imf_projection({ "indicator": "gdp_growth" })   // live provider (IMF_PROVIDER=imf)
"Real GDP growth (annual % change) — Nigeria: 4.2 in 2031 (latest WEO projection; 41 points)"
// The headline reports the FURTHEST projection year in range (2031, the WEO horizon), not the
// current year. structuredContent: {
//   indicator: "NGDP_RPCH",
//   label: "Real GDP growth (annual % change)",
//   country: "NGA",
//   points: [ { year: 1991, value: 0.4 }, …, { year: 2031, value: 4.2 } ],
//   includesProjections: true,
//   source: "imf",
//   retrievedAt: "2026-…Z"
// }

// → get_imf_projection({ "indicator": "inflation", "start_year": 2020, "end_year": 2026 })
// structuredContent.points → one { year, value } per year in range; value is null where the WEO reports no figure.
```

> **Aliases resolve to raw WEO codes.** An unknown alias is passed through as a raw code (upper-cased); an unrecognised code returns an actionable not-found error listing the supported aliases.

## Configuration — `IMF_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures (synthetic-but-plausible series, not live IMF figures) — for dev/eval |
| `imf` | **Live** WEO from the IMF DataMapper API (keyless). Set this for real data. |

No API key required.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-imf-weo   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-imf-weo   # live (real API)

IMF_PROVIDER=imf npm run start:stdio -w @braynexservices/nigeria-mcp-imf-weo   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
IMF_PROVIDER=imf npx @modelcontextprotocol/inspector node lanes/imf-weo/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-imf-weo": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-imf-weo"],
      "env": { "IMF_PROVIDER": "imf" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/imf-weo/dist/stdio.js"]`. Then ask, e.g., *"What's the IMF's GDP growth projection for Nigeria?"*

## Limits & notes
- **`includesProjections` is a HEURISTIC, not the IMF's own boundary.** The flag (and the per-call text) mark a year as a projection when `year >= the current calendar year`. The IMF's true estimate/actual cut-over (its `estimatesStartAfter` vintage marker) typically runs **a year or two earlier**, so recent years this lane reports as history may already be **IMF *estimates*, not observed outturns**. Treat near-present figures accordingly; the DataMapper API does not expose the per-series boundary, so we approximate it. Forward years are IMF WEO projections either way.
- **Nigeria only:** every series is `country: "NGA"`. The trailing country segment on the upstream endpoint does not actually filter, so the adapter indexes the NGA slice itself.
- **Series are cached ~6h** (WEO vintages update ~twice a year) — cuts repeat pulls of the large payload. 15s fetch timeout with backoff-retry on transient failures; falls back to an actionable error (or set `IMF_PROVIDER=mock`).
- **`value: null`** appears for years the WEO reports no figure — points are kept in order rather than dropped.
- **Source:** records carry `source: "imf"` and a fresh `retrievedAt` per call.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke (pins mock `gdp_growth` 2025) + `smoke:live` against the real IMF DataMapper API, independent code-review.
