/**
 * Bank lane end-to-end smoke test over an in-memory MCP client<->server pair.
 * Exercises both tools (list_banks, resolve_bank_account) + the not-found error path
 * against the mock provider. Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { bankTools } from "../src/tools.js";
import { MockBankProvider } from "../src/providers/mock.js";

const server = buildServer(bankTools(new MockBankProvider()), { name: "bank-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));

const banksRes = await client.callTool({ name: "list_banks", arguments: {} });
const banks = (banksRes.structuredContent as { banks: { code: string }[] }).banks;
console.log("list_banks count ->", banks.length);

const resolve = await client.callTool({
  name: "resolve_bank_account",
  arguments: { account_number: "0123456789", bank_code: "058" },
});
const resolved = resolve.structuredContent as
  | { accountName?: string; bankName?: string; source?: string }
  | undefined;
console.log("resolve ->", JSON.stringify(resolved));

const missing = await client.callTool({
  name: "resolve_bank_account",
  arguments: { account_number: "0000000000", bank_code: "058" },
});
console.log("not-found isError ->", missing.isError === true);

await client.close();
await server.close();

const ok =
  toolNames.length === 2 &&
  toolNames.includes("resolve_bank_account") &&
  toolNames.includes("list_banks") &&
  banks.length >= 1 &&
  resolved?.accountName === "ADAEZE OKONKWO" &&
  resolved?.bankName === "Guaranty Trust Bank" &&
  resolved?.source === "mock" &&
  missing.isError === true;

if (!ok) {
  console.error("BANK SMOKE FAIL");
  process.exit(1);
}
console.log("BANK SMOKE OK");
process.exit(0);
