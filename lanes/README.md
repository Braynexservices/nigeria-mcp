# `lanes/` — one MCP project per lane

Each subfolder is an **independent lane project** (`@braynexservices/nigeria-mcp-<lane>`) that depends on `@braynexservices/nigeria-mcp-core` (`shared/`) and registers its tools into the shared server.

| Folder | Lane | Status |
|---|---|---|
| `trade-intel/` | Trade intelligence | 🌐 **LIVE** (UN Comtrade, free) · v0.3.6 |
| `fx-rates/` | FX rates | 🌐 **LIVE** (open.er-api.com, free) · v0.2.6 |
| `bank-account/` | Bank-account resolve | 🌐 **LIVE** (Paystack, free key) · v0.2.6 |
| `electricity/` | Electricity / meter validation | 🌐 **LIVE** (VTpass, read-only, free key) · v0.2.6 |
| `grid3-boundaries/` | Admin boundaries (state/LGA/ward) | 🌐 **LIVE** (GRID3 ArcGIS, CC BY 4.0, keyless) · v0.1.0 |
| `admin-divisions/` | Admin divisions (36 states + FCT, 774 LGAs) | 📦 **OFFLINE** (bundled dataset, MIT, no network/no key) · v0.1.0 |
| `health-facility/` | Health facilities (nearest to a point) | 🌐 **LIVE** (GRID3 NGA Health Facilities v2.0, CC BY 4.0, keyless) · v0.1.0 |
| `worldbank-macro/` | Macro indicators | 🌐 **LIVE** (World Bank Indicators API, keyless) · v0.1.0 |
| `imf-weo/` | IMF World Economic Outlook | 🌐 **LIVE** (IMF DataMapper API, keyless) · v0.1.0 |
| `un-sdg/` | UN SDG indicators | 🌐 **LIVE** (UN SDG Global Database, keyless) · v0.1.0 |
| `quidax-crypto/` | Crypto tickers in Naira (read-only) | 🌐 **LIVE** (Quidax public API, keyless) · v0.1.0 |
| `nigsac-sanctions/` | Sanctions screening (best-effort signal) | 🌐 **LIVE** (NIGSAC register, keyless) · v0.1.0 |

## Per-lane code shape
```
lanes/<lane>/
├── package.json
├── README.md          # tool docs, providers, Claude config
└── src/
    ├── tools.ts        # MCP tools (Zod input + outputSchema + annotations)
    ├── providers/      # mock (default) + live adapter(s)
    ├── provider.ts     # env-driven provider factory
    ├── fixtures.ts     # deterministic offline data
    └── stdio.ts        # stdio entrypoint (npx-able bin)
```
