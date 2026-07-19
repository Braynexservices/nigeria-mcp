/**
 * LIVE check for the Quidax provider — hits the real KEYLESS public market-data API.
 * Not part of the default offline smoke. Run: npm run smoke:live -w @braynexservices/nigeria-mcp-quidax-crypto
 * Network required; no credentials.
 *
 * NOTE: exchange envelopes drift — a shape surprise is reported as FAILED lines + an
 * INCOMPLETE note rather than a crash; the mock smoke is the gate. Always exits 0.
 */
import { QuidaxCryptoProvider } from "../src/providers/quidax.js";

const provider = new QuidaxCryptoProvider();
let ok = true;

try {
  const t = await provider.getTicker("btcngn");
  console.log(
    `get_crypto_ticker btcngn -> last ${t.last} ${t.quote} (high ${t.high}, low ${t.low}, vol ${t.volume}) @ ${t.at}`,
  );
  // 1 BTC should be many millions of naira — a sanity bound, not a hardcoded price.
  if (t.market !== "btcngn" || t.base !== "BTC" || t.quote !== "NGN" || !(t.last > 1_000_000)) {
    ok = false;
    console.log(`get_crypto_ticker FAILED -> unexpected shape/values: ${JSON.stringify(t)}`);
  }
} catch (err) {
  ok = false;
  console.log(`get_crypto_ticker FAILED -> ${err instanceof Error ? err.message : err}`);
}

try {
  const markets = await provider.listMarkets();
  const preview = markets.slice(0, 5).map((m) => m.market).join(", ");
  console.log(`list_crypto_markets -> ${markets.length} markets (${preview}, …)`);
  if (markets.length < 10 || !markets.some((m) => m.market === "btcngn")) {
    ok = false;
    console.log("list_crypto_markets FAILED -> btcngn missing or the list is suspiciously short");
  }
} catch (err) {
  ok = false;
  console.log(`list_crypto_markets FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(
  ok
    ? "\nQUIDAX-CRYPTO LIVE CHECK OK"
    : "\nQUIDAX-CRYPTO LIVE CHECK INCOMPLETE — see FAILED lines above (the Quidax envelope may have shifted; the mock smoke remains the gate).",
);
process.exit(0); // live drift must not break CI; the offline smoke is the pass/fail gate
