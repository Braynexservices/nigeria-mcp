# Nigeria Quidax Crypto MCP

> Crypto market tickers in Naira (BTC/NGN, ETH/NGN, USDT/NGN, …) from the Nigerian exchange Quidax, exposed to AI agents as MCP tools.

**Status:** 🌐 **Live market data + free (no API key)** · read-only
**Package:** `@braynexservices/nigeria-mcp-quidax-crypto` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

---

## What it does
Returns live crypto tickers for market pairs listed on **[Quidax](https://quidax.io)**, a Nigerian exchange — the last traded price plus 24h high/low/volume, priced in the quote currency (e.g. `btcngn` = NGN per 1 BTC). Data comes from Quidax's public market-data API — **keyless** and **read-only** (no account, no orders, no trading). Public market data — no PII.

## Tools

### `get_crypto_ticker`
Latest ticker for one market pair.

| Param | Required | Notes |
|---|---|---|
| `market` | ✅ | Market pair id, lowercase, min 5 chars (e.g. `btcngn`, `ethngn`, `usdtngn`). Get valid ids from `list_crypto_markets`. |

**Example:**
```jsonc
// → get_crypto_ticker({ "market": "btcngn" })
"BTC/NGN last 90691052 NGN (as of 2026-07-18T09:06:00.000Z, source: quidax)"
// structuredContent: {
//   market:"btcngn", base:"BTC", quote:"NGN",
//   last:90691052, high:91686674, low:89489016, volume:0.57144386,
//   at:"2026-07-18T09:06:00.000Z", source:"quidax", retrievedAt:"…"
// }
```
`high` / `low` / `volume` are `null` when Quidax doesn't report them. The `source` field (`quidax` vs `mock`) is echoed into the text line — see **Limits & notes**.

### `list_crypto_markets`
All market pairs available on the exchange, each split into base asset + quote currency. Takes no arguments.

| Param | Required | Notes |
|---|---|---|
| _(none)_ | — | No input. |

**Example:**
```jsonc
// → list_crypto_markets({})
"3 markets: btcngn, ethngn, usdtngn"
// structuredContent: {
//   markets: [
//     { market:"btcngn",  base:"BTC",  quote:"NGN" },
//     { market:"ethngn",  base:"ETH",  quote:"NGN" },
//     { market:"usdtngn", base:"USDT", quote:"NGN" }
//   ],
//   count: 3
// }
```
> The mock provider lists the 3 fixture pairs above; the live Quidax provider lists 90+ pairs.

## Configuration — `CRYPTO_PROVIDER`

| Value | Behaviour |
|---|---|
| `mock` *(default)* | Offline deterministic fixtures (`btcngn`, `ethngn`, `usdtngn`) — **synthetic prices**, for dev/eval |
| `quidax` | **Live** tickers from Quidax's public market-data API (keyless). Set this for real prices. |

No API key required.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-quidax-crypto   # offline (mock)
npm run smoke:live -w @braynexservices/nigeria-mcp-quidax-crypto   # live (real Quidax API)

CRYPTO_PROVIDER=quidax npm run start:stdio -w @braynexservices/nigeria-mcp-quidax-crypto   # serve over stdio, live
```

**MCP Inspector** (interactive GUI):
```bash
CRYPTO_PROVIDER=quidax npx @modelcontextprotocol/inspector node lanes/quidax-crypto/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-quidax-crypto": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-quidax-crypto"],
      "env": { "CRYPTO_PROVIDER": "quidax" }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/quidax-crypto/dist/stdio.js"]`. Then ask, e.g., *"What's the BTC to naira price on Quidax right now?"*

## Limits & notes
- **Default provider is `mock` → SYNTHETIC prices, not the live market.** With `CRYPTO_PROVIDER` unset (or `mock`), the tools return deterministic fixture prices — useful for dev/eval, **not** real quotes. Every result carries its origin: the text line ends with `source: mock` vs `source: quidax`, and `structuredContent.source` says the same. So a synthetic price can never be mistaken for a live quote. **Set `CRYPTO_PROVIDER=quidax` for real prices.**
- **Informational, not trading advice.** These are read-only market tickers. No orders, positions, or account access — this lane cannot trade.
- **Live source is Quidax public market data** (`https://app.quidax.io/api/v1`), keyless. 15s fetch timeout; unknown pairs return an actionable "not found" (call `list_crypto_markets`), transient failures suggest `CRYPTO_PROVIDER=mock`.
- **Numbers:** prices/volume are numeric; `high`/`low`/`volume` may be `null` when the exchange omits them. `at` is the ISO-8601 ticker snapshot time; `retrievedAt` is when this server fetched it.

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: offline smoke (mock, `btcngn` pinned) + `smoke:live` against the real Quidax API, independent code-review (string-encoded prices parsed, `source` surfaced in text so mock is never passed off as live).
