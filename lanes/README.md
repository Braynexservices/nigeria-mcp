# `lanes/` — one MCP project per lane

Each subfolder is an **independent lane project** (`@braynexservices/nigeria-mcp-<lane>`) that depends on `@braynexservices/nigeria-mcp-core` (`shared/`) and registers its tools into the shared server.

| Folder | Lane | Status |
|---|---|---|
| `trade-intel/` | Trade intelligence | 🌐 **LIVE** (UN Comtrade, free) · v0.3.6 |
| `fx-rates/` | FX rates | 🌐 **LIVE** (open.er-api.com, free) · v0.2.6 |
| `bank-account/` | Bank-account resolve | 🌐 **LIVE** (Paystack, free key) · v0.2.6 |
| `electricity/` | Electricity / meter validation | 🌐 **LIVE** (VTpass, read-only, free key) · v0.2.6 |

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
