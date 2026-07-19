# Nigeria NIGSAC Sanctions MCP

> Screen a person or company name against Nigeria's official sanctions register, exposed to AI agents as an MCP tool.

**Status:** 🌐 **LIVE + keyless (no API key)**
**Package:** `@braynexservices/nigeria-mcp-nigsac-sanctions` v0.1.0 · depends on `@braynexservices/nigeria-mcp-core`
**Author:** Samuel Orie (Founder) · **Owner:** [Braynex Services Ltd](https://www.braynexservices.com) · **License:** [MIT](./LICENSE)
**© 2026 Braynex Services Ltd** — MIT licensed (copyright retained; see the [`NOTICE`](./NOTICE)).

> ⚠️ **Screening signal, not compliance clearance.** A `POTENTIAL_MATCH` is a prompt for human review; a `CLEAR` is not a legal determination. Read **[Scope & limitations](#scope--limitations)** before you rely on this for anything. Not a sole KYC/AML control.

---

## What it does
Screens a person or company name against the **official NIGSAC (Nigeria Sanctions Committee) register** — the Nigerian designations of both individuals and entities, published under the Terrorism (Prevention and Prohibition) Act 2022. The list is **scraped live** from the NIGSAC portal (keyless), cached, and matched locally. Each screen returns `CLEAR` or `POTENTIAL_MATCH` with candidate names and 0-1 similarity scores. Public designation data — the listed names are published sanctions designations, not private PII; the query name is pass-through and never persisted.

Matching is **best-effort and deliberately recall-leaning** — it over-flags so a human never misses a real designation. That means a `POTENTIAL_MATCH` is a *signal for review*, not proof of a hit, and a `CLEAR` covers the **Nigerian list only**.

## Tool

### `screen_sanctions`
| Param | Required | Notes |
|---|---|---|
| `name` | ✓ | Person or company name to screen (3–256 chars) |

Returns `status` (`CLEAR` \| `POTENTIAL_MATCH`), `matches` (candidates, highest similarity first — each with `name`, `listType`, `similarity` 0–1), `listVersion` (snapshot fetch-date + entry count), plus `source` and `retrievedAt` provenance.

**Example — a `CLEAR` result** (default live register):
```jsonc
// → screen_sanctions({ "name": "Acceptance Test Person" })
"\"Acceptance Test Person\" — CLEAR: no candidate matches on the NIGSAC Nigerian list (source: nigsac, list nigsac-2026-07-18-69). Not a legal clearance; covers the Nigerian list only."
// structuredContent:
// { query:"Acceptance Test Person", status:"CLEAR", matches:[],
//   listVersion:"nigsac-2026-07-18-69", source:"nigsac", retrievedAt }
```

**Example — a `POTENTIAL_MATCH` result** (shown against the offline `mock` stub for a reproducible hit):
```jsonc
// → screen_sanctions({ "name": "IBRAHIM TEST DOE" })
"\"IBRAHIM TEST DOE\" — POTENTIAL_MATCH: IBRAHIM TEST DOE (100%) — human review required (source: mock, list mock-fixtures-2026-07)"
// structuredContent:
// { query:"IBRAHIM TEST DOE", status:"POTENTIAL_MATCH",
//   matches:[{ name:"IBRAHIM TEST DOE", listType:"NIGSAC UNSC", similarity:1 }],
//   listVersion:"mock-fixtures-2026-07", source:"mock", retrievedAt }
```

> **`similarity`** is 0–1 (1 = exact normalized match). A partial score (e.g. a query that shares most tokens with a longer listed designation) still surfaces as a candidate — by design. The percentage is a matching confidence, **not** a probability that the subject is sanctioned.

## Configuration — `SANCTIONS_PROVIDER`

| Value | Behaviour |
|---|---|
| `nigsac` *(default)* | **Live** — fetches + parses the official NIGSAC register and screens against it. Keyless. **This is the default**; unlike other lanes, sanctions does not default to mock (a synthetic list would silently `CLEAR` every real name). |
| `mock` | Offline synthetic stub — an explicit opt-in (2 fake entries, `IBRAHIM TEST DOE` / `ACME SHELL CORP LTD`) for dev/eval with zero network. Never real designations. |

No API key required.

**`NIGSAC_LIST_URL`** *(optional)* — override the source. Point it at either an HTML list page (parsed like the default portal) **or** a founder-hosted JSON array of `{ name, listType }` (auto-detected by a leading `[`). Useful if the portal layout changes or you host a mirror.

## Scope & limitations

**Read this before relying on a result.** This lane is a screening aid, not a compliance product.

- **It deliberately over-flags.** Matching is best-effort **fuzzy**: diacritic-**folded** (`Bàbátúndé` matches `BABATUNDE`), transliteration-**tolerant** (`Mohammed` ~ `Muhammad`), and **containment-scored** (a shorter query still scores high against a longer listed designation instead of being diluted). A false `POTENTIAL_MATCH` costs a human a moment; a false `CLEAR` misses a real designation — so the scorer leans to recall. **A `POTENTIAL_MATCH` is a signal for human review, NOT a legal determination or compliance clearance.**
- **Nigerian list only.** Scope is the domestic NIGSAC register. A `CLEAR` means *"not on the Nigerian list"* — **not** *"unsanctioned everywhere"*. The **UN consolidated list is not screened here** (NIGSAC links it off-site; wiring it is a separate lane's job). Do not read a `CLEAR` as global.
- **Fail-loud, never a false `CLEAR`.** The live adapter **refuses to screen** if the register parses to an implausibly small number of entries (below a plausibility floor — the real register is ~69 rows). A changed layout, error, or challenge page raises an actionable error instead of screening against a truncated list and clearing real names.
- **Freshness is visible.** The list is cached with a TTL (re-fetched at most every ~6h; it changes rarely) and fetched with a 15s timeout + backoff-retry on transient failures. Every result carries a `listVersion` (fetch date + entry count, e.g. `nigsac-2026-07-18-69`) so callers can see exactly how fresh the snapshot is.
- **NOT compliance-grade.** Do **not** use this as a sole KYC/AML control. It is one screening input among many — pair any hit with authoritative verification and human judgement.

## Run it

```bash
npm install && npm run build      # from repo root

npm run smoke      -w @braynexservices/nigeria-mcp-nigsac-sanctions   # offline (mock stub)
npm run smoke:live -w @braynexservices/nigeria-mcp-nigsac-sanctions   # live (real NIGSAC register)

npm run start:stdio -w @braynexservices/nigeria-mcp-nigsac-sanctions  # serve over stdio (live by default)
```

**MCP Inspector** (interactive GUI):
```bash
npx @modelcontextprotocol/inspector node lanes/nigsac-sanctions/dist/stdio.js
```

**Claude Desktop / Code** — add to your MCP config (needs Node.js ≥ 20):
```json
{
  "mcpServers": {
    "nigeria-nigsac-sanctions": {
      "command": "npx",
      "args": ["-y", "@braynexservices/nigeria-mcp-nigsac-sanctions"]
    }
  }
}
```
The default is the **live register** — no `env` block is needed. To run fully offline against the synthetic stub instead, add `"env": { "SANCTIONS_PROVIDER": "mock" }`. Running from a clone: `"command": "node", "args": ["/path/to/nigeria-mcp/lanes/nigsac-sanctions/dist/stdio.js"]`. Then ask, e.g., *"Screen 'Ada Umeh Ltd' against the Nigerian sanctions list."*

## Verification
`npm run verify` (repo root) → build + all lane smokes + eval. This lane: an offline end-to-end smoke (exact / fuzzy-containment / `CLEAR` paths vs the mock stub) plus `smoke:live` against the real NIGSAC register (verified live 2026-07-18: HTTP 200, two tables — individuals + entities — 69 entries; parse quality confirmed against real rows). The live adapter's plausibility floor and cache/retry behaviour are exercised in review.
