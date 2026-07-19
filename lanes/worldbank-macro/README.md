# Nigeria World Bank Macro MCP

> Nigerian macroeconomic indicators (GDP, inflation, population, remittances, FDI, unemployment) as annual time series, exposed to AI agents as MCP tools.

**Status:** 🌐 **Live + free (no API key)**
**Package:** `@braynexservices/nigeria-mcp-worldbank-macro` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

---

## What it does
Fetches a Nigerian macroeconomic time series from the **World Bank Indicators API** (country `NGA`) and returns it as annual points, ascending by year. You name an indicator by a friendly alias (`gdp`, `inflation`, ...) or by any raw World Bank code (e.g. `NY.GDP.MKTP.CD`); optional year bounds trim the range. The source is free, keyless **Open Data** ([CC BY 4.0](https://datacatalog.worldbank.org/public-licenses)) — public macro data, no PII, no key.

## Tool

### `get_macro_indicator`
| Param | Required | Notes |
|---|---|---|
| `indicator` | ✓ | An alias (`gdp`, `gdp_growth`, `inflation`, `population`, `remittances`, `fdi`, `unemployment`) **or** any raw World Bank indicator code (e.g. `NY.GDP.MKTP.CD`). Case-insensitive; unknown aliases fall through as raw codes |
| `start_year` | — | Earliest year to include (integer, ≥ 1960). Default: full history |
| `end_year` | — | Latest year to include (integer, ≤ 2035). Default: latest available |

**Aliases → World Bank codes:**

| Alias | Code | Indicator |
|---|---|---|
| `gdp` | `NY.GDP.MKTP.CD` | GDP (current US$) |
| `gdp_growth` | `NY.GDP.MKTP.KD.ZG` | GDP growth (annual %) |
| `inflation` | `FP.CPI.TOTL.ZG` | Inflation, consumer prices (annual %) |
| `population` | `SP.POP.TOTL` | Population, total |
| `remittances` | `BX.TRF.PWKR.CD.DT` | Personal remittances, received (current US$) |
| `fdi` | `BX.KLT.DINV.CD.WD` | Foreign direct investment, net inflows (current US$) |
| `unemployment` | `SL.UEM.TOTL.ZS` | Unemployment, total (% of labor force) |

**Examples:**
```jsonc
// → get_macro_indicator({ "indicator": "gdp", "start_year": 2020, "end_year": 2023 })
"GDP (current US$) — Nigeria: latest 2023 = 487,387,801,877.8 (NY.GDP.MKTP.CD, 4 points)"
// structuredContent: {
//   indicator: "NY.GDP.MKTP.CD", label: "GDP (current US$)", unit: null, country: "NGA",
//   points: [ { year: 2020, value: 598586817817.39 }, ..., { year: 2023, value: 487387801877.8 } ],
//   source: "mock", retrievedAt: "..."
// }

// → get_macro_indicator({ "indicator": "inflation" })
"Inflation, consumer prices (annual %) — Nigeria: latest 2023 = 24.66 (FP.CPI.TOTL.ZG, 3 points)"

// raw World Bank codes pass straight through:
// → get_macro_indicator({ "indicator": "NY.GDP.MKTP.KD.ZG" })
```

The text line always highlights the **latest non-null** observation. `structuredContent` carries the full normalized series (`indicator`, `label`, `unit`, `country: "NGA"`, `points[]`) plus provenance (`source`, `retrievedAt`).

## Configuration — `MACRO_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures (a few core series: GDP, GDP growth, inflation) — for dev/eval, zero network |
| `worldbank` | **Live** data from the World Bank Indicators API (keyless, full catalogue). Set this for real data. |

No API key required.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-worldbank-macro   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-worldbank-macro   # live (real API)

MACRO_PROVIDER=worldbank npm run start:stdio -w @braynexservices/nigeria-mcp-worldbank-macro   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
MACRO_PROVIDER=worldbank npx @modelcontextprotocol/inspector node lanes/worldbank-macro/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-worldbank-macro": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-worldbank-macro"],
      "env": { "MACRO_PROVIDER": "worldbank" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/worldbank-macro/dist/stdio.js"]`. Then ask, e.g., *"What was Nigeria's GDP growth over the last few years?"*

## Limits & notes
- **Nulls are preserved, not zeroed.** Years the source doesn't report come back as `value: null` (never `0`) so you can tell "no data" from "genuinely zero". The text summary highlights the **latest non-null** point; if a range has no non-null observations it says so explicitly.
- **Nigeria only.** Every series is `country: "NGA"` — this lane is Nigeria-centric by design.
- **Annual frequency.** World Bank macro series are yearly; there is no sub-annual data here.
- **Unknown codes give an actionable error**, not silence — the World Bank "invalid value" envelope and empty-result cases surface as a not-found error that lists the supported aliases so an agent can self-correct.
- **20s fetch timeout with backoff-retry** on transient failures (timeout, network, 429/5xx); on hard failure it falls back to an actionable error (or set `MACRO_PROVIDER=mock`).
- **Source & licence:** World Bank Open Data, [CC BY 4.0](https://datacatalog.worldbank.org/public-licenses). Each series carries `source` and a fresh `retrievedAt` per call.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke (pins the GDP 2023 point positive) + `smoke:live` against the real World Bank API, independent code-review, cached.
