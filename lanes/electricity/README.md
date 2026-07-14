# `lanes/electricity/` — Electricity meter validation

**Lane:** Electricity / meter validation · **Phase:** 2 · **Status:** ✅ **LIVE** (VTpass, free) · v0.2.2
**Package:** `@braynexservices/nigeria-mcp-electricity` (depends on `@braynexservices/nigeria-mcp-core`) · **Owner:** Braynex Services Ltd · **License:** MIT

> Live via VTpass (`ELECTRICITY_PROVIDER=vtpass` + `VTPASS_API_KEY`/`VTPASS_PUBLIC_KEY`/`VTPASS_SECRET_KEY`). Verified: 12 DisCos + meter address-verify. READ-ONLY (no payments). `npm run smoke:live -w @braynexservices/nigeria-mcp-electricity`. Mock stays default for offline/eval.

**READ-ONLY** meter validation (customer name/address + DisCo) through the core provider seam.

> ⛔ **Validation/info ONLY — never payment execution.** The `MeterProvider` interface is payment-free by design; moving money would inherit NERC/CBN/AML obligations. Customer PII is pass-through, never persisted.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `validate_meter` | `{ meter_number, disco, meter_type }` | `NormalizedMeter` — customer name/address, DisCo, type |
| `list_discos` | `{}` | `{ discos: [{ code, name }] }` |

## Providers (`ELECTRICITY_PROVIDER`)

| Key | Source | Notes |
|---|---|---|
| `mock` *(default)* | local fixtures | 6 DisCos, prepaid/postpaid meters |
| `vtpass` | VTpass `/services` + `/merchant-verify` | ✅ **live** — read-only meter validate + DisCo list; needs `VTPASS_*` keys |

## Quickstart

```bash
npm install
npm run build -w @braynexservices/nigeria-mcp-core && npm run build -w @braynexservices/nigeria-mcp-electricity
npm run smoke -w @braynexservices/nigeria-mcp-electricity
npm run start:stdio -w @braynexservices/nigeria-mcp-electricity
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20 + free [VTpass](https://vtpass.com) keys):
```json
{
  "mcpServers": {
    "nigeria-electricity": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-electricity"],
      "env": {
        "ELECTRICITY_PROVIDER": "vtpass",
        "VTPASS_API_KEY": "...",
        "VTPASS_PUBLIC_KEY": "PK_...",
        "VTPASS_SECRET_KEY": "SK_...",
        "VTPASS_BASE_URL": "https://vtpass.com/api"
      }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/electricity/dist/stdio.js"]`. Omit `VTPASS_BASE_URL` to use the sandbox. Then ask, e.g., *"Validate meter 68100017372 on IKEDC prepaid."*
