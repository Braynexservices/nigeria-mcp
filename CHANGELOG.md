# Changelog — Nigeria MCP

A Braynex Services Ltd product. Each server is versioned independently (git tags `<server>-v<x.y.z>`).

## Current

| Server | Version |
|---|---|
| Trade Intel | **0.3.6** |
| FX Rates | **0.2.6** |
| Bank Resolve | **0.2.6** |
| Electricity Meter | **0.2.6** |
| Core (`nigeria-mcp-core`) | **0.3.2** |

## 2026-07-14

- **Published to the official MCP Registry** — all four servers listed under `io.github.Braynexservices/*`.
- **`npx`-ready** — every server ships a `bin`, so a client config needs no clone: `npx -y @braynexservices/nigeria-mcp-<server>`.
- **Node ≥ 20** declared (`engines`); build output no longer carries source comments.
- **Core** — retry backoff is jittered so clients don't stampede a recovering provider; core exports contracts for the servers it ships with, and a generic `providerKey(envVar)` accessor.
- **Docs** — copy-paste Claude config in every server README; error messages now name the env var to set rather than a local file path.
- Core `0.1.x` and `0.2.x` are **deprecated** — use `^0.3.0`.

## Live servers

### Trade Intel — UN Comtrade (keyless)
- `get_trade_stats` — annual **and monthly**; commodity by HS code or breakdown level (`total`/`chapters`/`headings`/`detailed`); USD value **plus CIF/FOB**, net weight, quantity; ranks all partners by value.
- `classify_hs` — HS code for a product description.
- Results cached ~6h (non-empty only); retries on throttle/timeout/5xx.

### FX Rates — open.er-api.com (keyless)
- `get_fx_rates` — live Naira rates vs USD/EUR/GBP. Cached ~1h.

### Bank Resolve — Paystack (free key)
- `resolve_bank_account` — NUBAN + bank code → registered account name. `list_banks` — bank/code lookup.
- 15s timeout + retry. The bank list is cached; **account resolutions (PII) are never cached**.

### Electricity Meter — VTpass (free key)
- `validate_meter` — **read-only** meter validation (customer name/address, DisCo, meter type). `list_discos` — DisCo list.
- No payments, by design. Uses the authoritative on-file meter type and fails closed on a mismatch. **Customer PII is never cached.**

## Foundation
- Core (`@braynexservices/nigeria-mcp-core`) — `buildServer`, normalized Zod schemas, typed provider seam, `fetchJson` (timeout + jittered retry), cache/error helpers, stdio + stateless HTTP transports.
- Every server ships an offline mock provider (zero signup); cross-server eval runs fully offline.
