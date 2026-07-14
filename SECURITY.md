# Security Policy

## Supported versions

Only the latest published version of each `@braynexservices/nigeria-mcp-*` package receives security fixes.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

- Email **braynexservices@gmail.com** with the details (affected package + version, reproduction steps, impact).
- You should receive an acknowledgement within **72 hours**.
- We follow a fix-forward policy: confirmed issues are patched in a new npm release and the vulnerable version is deprecated via `npm deprecate`.

## Scope notes

- These servers are **read-only lookups** — they never move money, mutate provider state, or persist identity PII (account names, meter customer data are pass-through, never cached).
- Provider credentials (`PAYSTACK_SECRET_KEY`, `VTPASS_*`) are read from environment variables only; never commit them. Keys travel in request headers, never in URLs or logs.
