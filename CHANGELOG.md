# Changelog — Nigeria MCP

A Braynex Services Ltd product. Each server is versioned independently (git tags `<server>-v<x.y.z>`).

## Current

| Server | Version |
|---|---|
| Trade Intel | **0.3.6** |
| FX Rates | **0.2.6** |
| Bank Resolve | **0.2.6** |
| Electricity Meter | **0.2.6** |
| Admin Boundaries | **0.1.0** |
| Admin Divisions | **0.1.0** |
| Health Facilities | **0.1.0** |
| World Bank Macro | **0.1.0** |
| IMF WEO | **0.1.0** |
| UN SDG | **0.1.0** |
| Crypto Tickers | **0.1.0** |
| Sanctions Screening | **0.1.0** |
| Core (`nigeria-mcp-core`) | **0.3.2** |

## 2026-07-18

- **Eight new servers — Nigeria MCP grows from 4 to 12.** All eight are **keyless** and ship mock-first (offline mock provider by default). Seven serve **live** data with no signup; **admin-divisions** runs fully offline on a bundled dataset — no network at all.
- **Geospatial**
  - `grid3-boundaries` — Nigeria admin boundaries (state / LGA / ward): centroid, bounding box, and reverse-geocode a lat/lng point to the admin unit that contains it. GRID3 ArcGIS (CC BY 4.0).
  - `admin-divisions` — Nigeria's 36 states + FCT and all 774 LGAs. **Fully offline** bundled dataset — no network, no key.
  - `health-facility` — find Nigerian health facilities near a point, sorted by distance, plus detail for a single facility. GRID3 NGA Health Facilities v2.0 (CC BY 4.0).
- **Economic**
  - `worldbank-macro` — Nigerian macro indicators (GDP, inflation, population, remittances, FDI, unemployment). World Bank Indicators API.
  - `imf-weo` — IMF World Economic Outlook projections for Nigeria (growth, inflation, debt, current account, unemployment). IMF DataMapper API.
  - `un-sdg` — Nigeria UN SDG indicators (poverty, under-5 mortality, electricity & water access, primary completion). UN SDG Global Database.
- **Markets**
  - `quidax-crypto` — live crypto tickers in Naira (BTC/NGN etc.), read-only, plus the tradable market list. Quidax public API.
- **Compliance**
  - `nigsac-sanctions` — screen a name against Nigeria's official NIGSAC sanctions register. A **best-effort fuzzy screening signal for human review — not a legal/compliance determination**, and it covers the Nigerian list only.

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

### Admin Boundaries — GRID3 ArcGIS (keyless)
- `get_boundary` — centroid + bounding box for a state / LGA / ward. `point_in_admin` — reverse-geocode a lat/lng point to the admin unit that contains it.
- Public geospatial data (CC BY 4.0), no PII.

### Admin Divisions — bundled dataset (offline, no key)
- `list_states` — the 36 states + FCT. `get_lgas` — the LGAs for a state (774 total).
- Runs **fully offline** — no network call at all. Static reference data.

### Health Facilities — GRID3 NGA Health Facilities v2.0 (keyless)
- `find_facilities_near` — health facilities near a lat/lng, sorted by distance. `get_facility` — detail for a single facility.
- Public geospatial data (CC BY 4.0), no PII.

### World Bank Macro — World Bank Indicators API (keyless)
- `get_macro_indicator` — Nigerian macro series (GDP, inflation, population, remittances, FDI, unemployment).
- Public macro data, no PII. Results cached.

### IMF WEO — IMF DataMapper API (keyless)
- `get_imf_projection` — IMF World Economic Outlook for Nigeria (growth, inflation, debt, current account, unemployment), including forward projections.
- Public macro data, no PII.

### UN SDG — UN SDG Global Database (keyless)
- `get_sdg_indicator` — Nigeria UN SDG indicators (poverty, under-5 mortality, electricity & water access, primary completion).
- Public development data, no PII.

### Crypto Tickers — Quidax (keyless)
- `get_crypto_ticker` — live price in Naira for a crypto market (BTC/NGN etc.). `list_crypto_markets` — the tradable market list.
- **Read-only** market data. No trading, no keys, no PII.

### Sanctions Screening — NIGSAC register (keyless)
- `screen_sanctions` — screen a name against Nigeria's official NIGSAC sanctions register.
- **Best-effort fuzzy screening signal for human review — NOT a legal/compliance determination.** Nigerian list only. No non-Nigerian or international lists are consulted.

## Foundation
- Core (`@braynexservices/nigeria-mcp-core`) — `buildServer`, normalized Zod schemas, typed provider seam, `fetchJson` (timeout + jittered retry), cache/error helpers, stdio + stateless HTTP transports.
- Every server ships an offline mock provider (zero signup); cross-server eval runs fully offline.
