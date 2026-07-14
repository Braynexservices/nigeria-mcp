# `lanes/bank-account/` — Bank-account resolve

**Lane:** Bank-account resolve · **Phase:** 1 · **Status:** ✅ **LIVE** (Paystack, free) · v0.2.2
**Package:** `@braynexservices/nigeria-mcp-bank-account` (depends on `@braynexservices/nigeria-mcp-core`) · **Owner:** Braynex Services Ltd · **License:** MIT

> Live via Paystack (`BANK_PROVIDER=paystack` + `PAYSTACK_SECRET_KEY`). Verified: 255 banks + account resolution. `npm run smoke:live -w @braynexservices/nigeria-mcp-bank-account`. Mock stays the default for offline/eval.

Resolves a Nigerian **NUBAN** (10-digit account number) + bank code → the registered **account name**, through the core provider seam. Mock is the default so it runs with zero signup.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `resolve_bank_account` | `{ account_number (10 digits), bank_code }` | `NormalizedBankAccount` — `accountName, bankCode, bankName?, source, retrievedAt` |
| `list_banks` | `{}` | `{ banks: [{ name, code }] }` — bank-code lookup helper |

## Providers (`BANK_PROVIDER`)

| Key | Source | Cost | Notes |
|---|---|---|---|
| `mock` *(default)* | local fixtures | free | zero signup; deterministic |
| `paystack` | Paystack `/bank/resolve` + `/bank` | free | needs `PAYSTACK_SECRET_KEY`; fails loudly with a hint if unset |

## Quickstart

```bash
# from repo root
npm install
npm run build -w @braynexservices/nigeria-mcp-core          # build core first (lanes import its dist)
npm run build -w @braynexservices/nigeria-mcp-bank-account

npm run smoke -w @braynexservices/nigeria-mcp-bank-account   # in-memory MCP e2e (exits non-zero on failure)
npm run start:stdio -w @braynexservices/nigeria-mcp-bank-account   # serve over stdio (default mock provider)

# live Paystack (free key required):
BANK_PROVIDER=paystack PAYSTACK_SECRET_KEY=sk_... npm run start:stdio -w @braynexservices/nigeria-mcp-bank-account
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20 + a free [Paystack](https://paystack.com) secret key):
```json
{
  "mcpServers": {
    "nigeria-bank-resolve": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-bank-account"],
      "env": { "BANK_PROVIDER": "paystack", "PAYSTACK_SECRET_KEY": "sk_..." }
    }
  }
}
```
Running from a clone instead: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/bank-account/dist/stdio.js"]`. Then ask, e.g., *"Whose account is 0123456789 at GTBank?"*

## Status

- ✅ `mock` provider verified (build + smoke + not-found path).
- ✅ `paystack` adapter **live-verified** (`npm run smoke:live`): bank list + account resolution against the real API. Fails loudly with an actionable hint when the key is missing or wrong; account resolutions (PII) are never cached.
