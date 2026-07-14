/**
 * LIVE check for the free (open.er-api.com) FX provider — hits the real keyless API.
 * Not part of the default offline smoke. Run: npm run smoke:live -w @braynexservices/nigeria-mcp-fx-rates
 * Exits non-zero on failure. Network required.
 */
import { FreeFxProvider } from "../src/providers/freeFx.js";

const p = new FreeFxProvider();

const all = await p.rates(); // NGN vs default quotes
console.log("rates:", all.map((r) => `1 ${r.quote}=${r.rate} ${r.base}`).join(", "));

const usd = await p.rates("NGN", "USD");
console.log("NGN/USD ->", JSON.stringify(usd[0] ?? null));

const ok =
  all.length === 3 &&
  all.every((r) => r.base === "NGN" && r.source === "open-er-api" && r.market === "official") &&
  // 1 USD in NGN should be a few hundred+ naira — sanity bound, not a hardcoded rate
  (usd[0]?.rate ?? 0) > 100 &&
  usd[0]?.quote === "USD";

if (!ok) {
  console.error("FX LIVE CHECK FAIL");
  process.exit(1);
}
console.log("FX LIVE CHECK OK");
process.exit(0);
