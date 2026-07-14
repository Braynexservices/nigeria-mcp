# Nigeria MCP — Nigerian data for AI agents

**A [Braynex Services Ltd](https://www.braynexservices.com) product.** Author: Samuel Orie. License: **MIT**.

Clean, normalized **Nigerian business & local data** exposed to AI agents (Claude, Cursor, custom agents) as **MCP tools** — one server per data source, each behind a typed provider seam.

> **Status:** 4 servers **LIVE** on npm + the official **MCP Registry**. Every server runs offline on a mock provider with zero signup; live data is one env var.

---

## Products

| Server | npm | Tools | Live source | Key? |
|---|---|---|---|---|
| **Trade Intel** | `@braynexservices/nigeria-mcp-trade-intel` | `get_trade_stats` · `classify_hs` | UN Comtrade | **none** |
| **FX Rates** | `@braynexservices/nigeria-mcp-fx-rates` | `get_fx_rates` | open.er-api.com | **none** |
| **Bank Resolve** | `@braynexservices/nigeria-mcp-bank-account` | `resolve_bank_account` · `list_banks` | Paystack | free key |
| **Electricity Meter** | `@braynexservices/nigeria-mcp-electricity` | `validate_meter` · `list_discos` | VTpass (read-only) | free key |

- **Trade Intel** — Nigeria import/export statistics by partner, commodity and year, **annual or monthly**, with USD value (plus CIF/FOB), net weight and quantity, and commodity breakdowns. Plus HS-code classification.
- **FX Rates** — live Naira rates against USD, EUR and GBP.
- **Bank Resolve** — resolve a 10-digit NUBAN + bank code to the registered account name; list banks with their codes.
- **Electricity Meter** — **read-only** meter validation (customer name/address + DisCo) and the DisCo list. No payments.

Each server's README has full tool docs, examples and a copy-paste config: see `lanes/<server>/README.md`.
Real-world applications: **[USE_CASES.md](USE_CASES.md)**.

## Install — Claude Desktop / Code

No clone needed (Node.js ≥ 20). Add to your MCP config:

```jsonc
{
  "mcpServers": {
    "nigeria-trade-intel": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-trade-intel"],
      "env": { "TRADE_PROVIDER": "opendata" }      // live data, no key
    },
    "nigeria-fx-rates": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-fx-rates"],
      "env": { "FX_PROVIDER": "free" }             // live data, no key
    }
  }
}
```

Then ask: *"What were Nigeria's top crude-oil export partners in 2023?"* or *"What's the dollar to naira rate right now?"*

The keyed servers take their credentials the same way — see [`lanes/bank-account/README.md`](lanes/bank-account/README.md) (free [Paystack](https://paystack.com) key) and [`lanes/electricity/README.md`](lanes/electricity/README.md) (free [VTpass](https://vtpass.com) keys). Omit the env block entirely and every server runs on offline mock data.

## MCP Registry

Listed on the official registry as:

```
io.github.Braynexservices/nigeria-trade-intel
io.github.Braynexservices/nigeria-fx-rates
io.github.Braynexservices/nigeria-bank-resolve
io.github.Braynexservices/nigeria-electricity
```

## Build from source

```bash
npm install
npm run build      # core first, then each server (npm workspaces)
npm run verify     # build + smokes + cross-server eval — fully offline, zero signup
```

## How it works

| Path | What it is |
|---|---|
| `shared/` | Core library — `buildServer`, normalized Zod schemas, the typed provider seam, `fetchJson` (timeout + jittered retry), cache + error helpers. |
| `lanes/<server>/` | One MCP server per data source — a `mock` provider (default) plus the live adapter, tools, and smoke/live tests. |
| `eval/` | Cross-server eval harness (`npm run eval`). |

Tools never call a provider directly: they depend on a typed interface, so selecting a provider is one env var and adding one is one file. Identity data (account names, meter customer details) is **pass-through only — never cached, never logged**; API keys travel in headers, never in URLs.

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md). Do not open a public issue.

---

© 2026 **Braynex Services Ltd** — MIT licensed (see [`LICENSE`](LICENSE) + [`NOTICE`](NOTICE)). "Braynex Services Ltd" and the product names are trademarks of Braynex Services Ltd.
