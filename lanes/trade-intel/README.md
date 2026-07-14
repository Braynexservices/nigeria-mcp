# Nigeria Trade Intel MCP

> Nigeria import/export **trade statistics** + **HS-code classification**, exposed to AI agents as MCP tools.

**Status:** 🌐 **LIVE + free (no API key)**
**Package:** `@braynexservices/nigeria-mcp-trade-intel` v0.3.2 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](../../LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see repo-root [`NOTICE`](../../NOTICE)).

---

## What it does
Answers questions about Nigeria's external trade — who Nigeria trades with, in what commodities, for how much — and maps product descriptions to HS codes. Trade data comes live from **UN Comtrade's free, keyless API**; partner/country names are resolved from Comtrade's own reference data (so they're correct, not guessed). Public macro data only — no PII.

## Tools

### `get_trade_stats`
Nigeria import/export flows — by partner, commodity, year, **annual or monthly**, with **value (USD + CIF/FOB), net weight and quantity** where reported.

| Param | Required | Notes |
|---|---|---|
| `flow` | ✅ | `"import"` or `"export"` |
| `partner` | — | country name (`China`), ISO (`CHN`/`CN`), or numeric code; **omit to rank all partners by value** |
| `commodity` | — | an HS code (`85`, `2709`) **or a breakdown level**: `total` (default), `chapters` (by HS chapter), `headings` (4-digit), `detailed` (6-digit) |
| `year` | — | reporting year (default `2023`; annual data lags ~1–2y) |
| `frequency` | — | `annual` (default) or `monthly` |
| `month` | — | `1`–`12`, required when `frequency: "monthly"` |

**Each flow returns:** `reporter, partner, hsCode, commodity, flow, period, year, valueUsd, cifValueUsd, fobValueUsd, netWeightKg, quantity, quantityUnit, source, retrievedAt`
(CIF is populated for imports, FOB for exports; weight/quantity appear where the reporter filed them.)

**Examples (live):**
```jsonc
// Top export partners:  get_trade_stats({ "flow": "export" })
//   Netherlands $8.18B · Spain $6.13B · India $5.45B …

// Commodity breakdown:  get_trade_stats({ "flow":"import", "partner":"China", "commodity":"chapters" })
//   HS84 Machinery $3.01B · HS85 Electrical machinery $1.81B · HS87 Vehicles $675M …  (96 chapters)

// Specific commodity, with weight:  get_trade_stats({ "flow":"export", "partner":"India", "commodity":"2709" })
//   { commodity:"Petroleum oils … crude", valueUsd:4.77B, fobValueUsd:4.77B, netWeightKg:6.4B, period:"2023" }

// Monthly:  get_trade_stats({ "flow":"import", "partner":"China", "commodity":"85", "frequency":"monthly", "year":2023, "month":12 })
//   { period:"202312", valueUsd:201M, cifValueUsd:201M }
```

### `classify_hs`
Suggest an HS code for a product description (free local heuristic; commercial classifier = future paid upgrade).
```jsonc
// → classify_hs({ "product_description": "cocoa beans for export" })
// structuredContent: { query, hsCode: "1801", heading: "Cocoa beans, whole or broken", source: "heuristic", retrievedAt }
```

## Configuration — `TRADE_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures — zero network, for dev/eval |
| `opendata` | **Live** UN Comtrade (keyless). Set this to use real data. |

No API key required. (Optional: a free Comtrade key raises the 500-records/call cap — see *Limits*.)

## Run it

```bash
npm install && npm run build      # from repo root

# offline smoke (mock) + live check (real API)
npm run smoke      -w @braynexservices/nigeria-mcp-trade-intel
npm run smoke:live -w @braynexservices/nigeria-mcp-trade-intel

# serve over stdio (live data)
TRADE_PROVIDER=opendata npm run start:stdio -w @braynexservices/nigeria-mcp-trade-intel
```

**MCP Inspector** (interactive GUI):
```bash
TRADE_PROVIDER=opendata npx @modelcontextprotocol/inspector node lanes/trade-intel/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-trade-intel": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-trade-intel"],
      "env": { "TRADE_PROVIDER": "opendata" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/trade-intel/dist/stdio.js"]`. Then ask, e.g., *"What were Nigeria's top crude-oil export partners in 2023?"*

## Limits & notes
- **Rate limits:** the keyless tier caps at 500 records/call and throttles rapid calls (HTTP 429). The adapter **caches non-empty results (~6h)** so repeat queries don't re-hit the API, **retries with backoff** on transient failures (throttle, timeout, network), and falls back to an actionable error; mock is always available offline. A free Comtrade key (https://comtradeplus.un.org/) raises limits.
- **Parallel/black-market FX is not here** (that's the FX lane); this lane is official trade statistics.
- **Commodity descriptions** are best-effort labels for common HS codes; arbitrary codes show `HS <code>`.
- **Data lag:** UN Comtrade annual data trails the current year by ~1–2 years.
- **`classify_hs`** is a keyword heuristic — good for common goods; a commercial classifier (Avalara/Zonos) is the accuracy upgrade.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke + `smoke:live` against the real API, independent code-review, hardened (regime filter, canonical partner codes, 429 retry).
