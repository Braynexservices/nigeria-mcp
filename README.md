# Nigeria MCP — Nigerian data for AI agents

**A [Braynex Services Ltd](https://www.braynexservices.com) product.** Author: Samuel Orie. License: **MIT**.

Clean, normalized **Nigerian business & local data** exposed to AI agents (Claude, Cursor, custom agents) as **MCP tools** — one server per data source, each behind a typed provider seam.

> **Status:** 12 servers **LIVE** on npm (the original 4 also on the official **MCP Registry**). Every server runs offline on a mock provider with zero signup; live data is one env var and every new lane is **keyless** (admin-divisions runs fully offline — it has no live data source).

---

## Products

| Server | npm | Tools | Live source | Key? |
|---|---|---|---|---|
| **Trade Intel** | `@braynexservices/nigeria-mcp-trade-intel` | `get_trade_stats` · `classify_hs` | UN Comtrade | **none** |
| **FX Rates** | `@braynexservices/nigeria-mcp-fx-rates` | `get_fx_rates` | open.er-api.com | **none** |
| **Bank Resolve** | `@braynexservices/nigeria-mcp-bank-account` | `resolve_bank_account` · `list_banks` | Paystack | free key |
| **Electricity Meter** | `@braynexservices/nigeria-mcp-electricity` | `validate_meter` · `list_discos` | VTpass (read-only) | free key |
| **Admin Boundaries** | `@braynexservices/nigeria-mcp-grid3-boundaries` | `get_boundary` · `point_in_admin` | GRID3 ArcGIS (CC BY 4.0) | **none** |
| **Admin Divisions** | `@braynexservices/nigeria-mcp-admin-divisions` | `list_states` · `get_lgas` | Bundled dataset (offline) | **none** |
| **Health Facilities** | `@braynexservices/nigeria-mcp-health-facility` | `find_facilities_near` · `get_facility` | GRID3 NGA Health Facilities v2.0 (CC BY 4.0) | **none** |
| **World Bank Macro** | `@braynexservices/nigeria-mcp-worldbank-macro` | `get_macro_indicator` | World Bank Indicators API | **none** |
| **IMF WEO** | `@braynexservices/nigeria-mcp-imf-weo` | `get_imf_projection` | IMF DataMapper API | **none** |
| **UN SDG** | `@braynexservices/nigeria-mcp-un-sdg` | `get_sdg_indicator` | UN SDG Global Database | **none** |
| **Crypto Tickers** | `@braynexservices/nigeria-mcp-quidax-crypto` | `get_crypto_ticker` · `list_crypto_markets` | Quidax (read-only) | **none** |
| **Sanctions Screening** | `@braynexservices/nigeria-mcp-nigsac-sanctions` | `screen_sanctions` | NIGSAC register | **none** |

- **Trade Intel** — Nigeria import/export statistics by partner, commodity and year, **annual or monthly**, with USD value (plus CIF/FOB), net weight and quantity, and commodity breakdowns. Plus HS-code classification.
- **FX Rates** — live Naira rates against USD, EUR and GBP.
- **Bank Resolve** — resolve a 10-digit NUBAN + bank code to the registered account name; list banks with their codes.
- **Electricity Meter** — **read-only** meter validation (customer name/address + DisCo) and the DisCo list. No payments.
- **Admin Boundaries** — Nigeria admin boundaries (state / LGA / ward): centroid, bounding box, and reverse-geocode a lat/lng point to the admin unit that contains it. GRID3 ArcGIS, keyless.
- **Admin Divisions** — Nigeria's 36 states + FCT and all 774 LGAs. Runs **fully offline** on a bundled dataset — no network, no key.
- **Health Facilities** — find Nigerian health facilities near a point, sorted by distance, with details for a single facility. GRID3 NGA Health Facilities v2.0, keyless.
- **World Bank Macro** — Nigerian macro indicators (GDP, inflation, population, remittances, FDI, unemployment) from the World Bank Indicators API. Keyless.
- **IMF WEO** — IMF World Economic Outlook projections for Nigeria (growth, inflation, debt, current account, unemployment) from the IMF DataMapper API. Keyless.
- **UN SDG** — Nigeria UN SDG indicators (poverty, under-5 mortality, electricity & water access, primary completion) from the UN SDG Global Database. Keyless.
- **Crypto Tickers** — live crypto tickers in Naira (BTC/NGN etc.), **read-only**, plus the tradable market list. Quidax public API, keyless.
- **Sanctions Screening** — screen a name against Nigeria's official NIGSAC sanctions register. A **best-effort fuzzy screening signal for human review — not a legal/compliance determination**, and it covers the Nigerian list only. Keyless.

Each server's README has full tool docs, examples and a copy-paste config: see `lanes/<server>/README.md`.
Real-world applications: **[USE_CASES.md](USE_CASES.md)**.

## Install

### One click (Claude Desktop)

Download a bundle from the [latest release](https://github.com/Braynexservices/nigeria-mcp/releases/latest) and double-click it. No terminal, no clone — the bundle carries everything it needs, and the keyed servers prompt you for the free API key during install (leave it blank to run on offline mock data).

### Or via npx (any MCP client)

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

## Find it on

- **Official MCP Registry** — all 12 servers, `io.github.Braynexservices/nigeria-{trade-intel,fx-rates,bank-resolve,electricity,grid3-boundaries,admin-divisions,health-facility,worldbank-macro,imf-weo,un-sdg,quidax-crypto,nigsac-sanctions}`
- **Smithery** — [@braynexservices/nigeria-fx-rates](https://smithery.ai/server/@braynexservices/nigeria-fx-rates) · [trade-intel](https://smithery.ai/server/@braynexservices/nigeria-trade-intel) · [bank-resolve](https://smithery.ai/server/@braynexservices/nigeria-bank-resolve) · [electricity](https://smithery.ai/server/@braynexservices/nigeria-electricity) (indexes from the MCP Registry; the 8 newer servers appear there automatically as Smithery re-crawls)
- **Glama** — [glama.ai/mcp/servers/Braynexservices/nigeria-mcp](https://glama.ai/mcp/servers/Braynexservices/nigeria-mcp)
- **npm** — [@braynexservices](https://www.npmjs.com/settings/braynexservices/packages)

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
