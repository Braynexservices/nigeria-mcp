/**
 * LIVE check for the VTpass meter provider — hits the real API. Needs VTPASS_* keys.
 * Run: npm run smoke:live -w @braynexservices/nigeria-mcp-electricity  (exits non-zero on failure)
 * Uses VTpass sandbox test meter 1111111111111 (resolves to a TESTMETER customer).
 */
import { VtpassMeterProvider } from "../src/providers/vtpass.js";

const p = new VtpassMeterProvider();

const discos = await p.listDiscos();
console.log("list_discos ->", discos.length, "sample:", discos.slice(0, 4).map((d) => d.code).join(", "));

const byServiceId = await p.validate("1111111111111", "ikeja-electric", "prepaid");
console.log("validate (serviceID) ->", JSON.stringify(byServiceId));

const byAbbrev = await p.validate("1111111111111", "IKEDC", "prepaid"); // flexible: abbreviation
console.log("validate (abbrev IKEDC) ->", byAbbrev.disco, byAbbrev.customerName);

const ok =
  discos.length >= 10 &&
  byServiceId.source === "vtpass" &&
  // disco is normalized to the DisCo code (matches the mock + schema), not the VTpass serviceID
  byServiceId.disco === "IKEDC" &&
  (byServiceId.customerName?.length ?? 0) > 0 &&
  byAbbrev.disco === "IKEDC"; // serviceID and abbreviation both resolve to the same DisCo

if (!ok) {
  console.error("ELECTRICITY LIVE CHECK FAIL");
  process.exit(1);
}
console.log("ELECTRICITY LIVE CHECK OK");
process.exit(0);
