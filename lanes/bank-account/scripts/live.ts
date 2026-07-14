/**
 * LIVE check for the Paystack bank provider — hits the real API. Needs PAYSTACK_SECRET_KEY.
 * Run: npm run smoke:live -w @braynexservices/nigeria-mcp-bank-account  (exits non-zero on failure)
 * Uses Paystack's test account 0000000000 (resolves to "Test" in test mode).
 */
import { PaystackBankProvider } from "../src/providers/paystack.js";

const p = new PaystackBankProvider();

const banks = await p.listBanks();
console.log("list_banks ->", banks.length, "banks; sample:", banks.slice(0, 3).map((b) => `${b.name}(${b.code})`).join(", "));

const acct = await p.resolve("0000000000", "057");
console.log("resolve ->", JSON.stringify(acct));

const ok =
  banks.length > 50 &&
  acct.source === "paystack" &&
  acct.accountNumber === "0000000000" &&
  typeof acct.accountName === "string" &&
  acct.accountName.length > 0;

if (!ok) {
  console.error("BANK LIVE CHECK FAIL");
  process.exit(1);
}
console.log("BANK LIVE CHECK OK");
process.exit(0);
