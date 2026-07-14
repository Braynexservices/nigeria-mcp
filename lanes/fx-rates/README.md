# Nigeria FX Rates MCP

> Live Naira (NGN) exchange rates vs major currencies, exposed to AI agents as MCP tools.

**Status:** 🌐 **LIVE + free (no API key)**
**Package:** `@braynexservices/nigeria-mcp-fx-rates` v0.2.2 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](../../LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see repo-root [`NOTICE`](../../NOTICE)).

---

## What it does
Returns the Naira's exchange rate against major currencies (USD, EUR, GBP). Rates are fetched live from **open.er-api.com** (free, keyless) and cached ~1h. Each rate means `1 {quote} = {rate} {base}`, base = NGN (e.g. *1 USD = 1,366 NGN*). Public market data — no PII, no key.

## Tool

### `get_fx_rates`
| Param | Required | Notes |
|---|---|---|
| `base` | — | base currency (only `NGN` is supported; defaults to NGN) |
| `quote` | — | filter to one quote currency (e.g. `USD`); omit for USD + EUR + GBP |

**Example:**
```jsonc
// → get_fx_rates({ "quote": "USD" })
"1 USD = 1,365.90 NGN (official)"
// structuredContent.rates: [{ base:"NGN", quote:"USD", rate:1365.9, market:"official", source:"open-er-api", retrievedAt }]

// → get_fx_rates({})
"1 USD = 1,365.90 NGN" · "1 EUR = 1,562.07 NGN" · "1 GBP = 1,808.96 NGN"
```

> **`market: "official"`** = the post-2023-float market/interbank (NAFEM) window. The **parallel ("aboki")** rate needs a different source and is not provided here (mock-only / future tier).

## Configuration — `FX_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures (NGN vs USD/EUR/GBP, official + parallel) — for dev/eval |
| `free` | **Live** rates from open.er-api.com (keyless). Set this for real data. |

No API key required.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-fx-rates   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-fx-rates   # live (real API)

FX_PROVIDER=free npm run start:stdio -w @braynexservices/nigeria-mcp-fx-rates   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
FX_PROVIDER=free npx @modelcontextprotocol/inspector node lanes/fx-rates/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-fx-rates": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-fx-rates"],
      "env": { "FX_PROVIDER": "free" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/fx-rates/dist/stdio.js"]`. Then ask, e.g., *"What's the dollar to naira rate right now?"*

## Limits & notes
- **Rates are cached ~1h** (open.er-api refreshes ~daily) — cuts calls and respects the free tier. 15s fetch timeout with backoff-retry on transient failures (timeout, network, 429/5xx); falls back to an actionable error (or set `FX_PROVIDER=mock`).
- **NGN-base only:** a non-NGN `base` returns no rows (this lane is Naira-centric).
- **Official window only** via the free source; **parallel/aboki** = future tier.
- **Source:** rates carry `source: "open-er-api"` and a fresh `retrievedAt` per call.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke + `smoke:live` against the real API, independent code-review (USD self-rate verified), cached.
