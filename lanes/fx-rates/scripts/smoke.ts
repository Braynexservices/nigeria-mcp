/**
 * FX lane end-to-end smoke test over an in-memory MCP client<->server pair.
 * Exercises get_fx_rates (filtered + all + empty pair) against the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { fxTools } from "../src/tools.js";
import { MockFxProvider } from "../src/providers/mock.js";

const server = buildServer(fxTools(new MockFxProvider()), { name: "fx-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));

const usd = await client.callTool({ name: "get_fx_rates", arguments: { quote: "USD" } });
const usdRates = (usd.structuredContent as { rates: { quote: string; market: string; source: string }[] })
  .rates;
console.log("USD rates ->", JSON.stringify(usdRates));

const all = await client.callTool({ name: "get_fx_rates", arguments: {} });
const allRates = (all.structuredContent as { rates: unknown[] }).rates;
console.log("all rates count ->", allRates.length);

const none = await client.callTool({ name: "get_fx_rates", arguments: { quote: "JPY" } });
const noneRates = (none.structuredContent as { rates: unknown[] }).rates;
console.log("JPY rates count ->", noneRates.length, "| isError ->", none.isError === true);

await client.close();
await server.close();

const markets = new Set(usdRates.map((r) => r.market));
const ok =
  toolNames.length === 1 &&
  toolNames.includes("get_fx_rates") &&
  usdRates.length === 2 &&
  usdRates.every((r) => r.quote === "USD" && r.source === "mock") &&
  markets.has("official") &&
  markets.has("parallel") &&
  allRates.length === 6 &&
  noneRates.length === 0 &&
  none.isError !== true;

if (!ok) {
  console.error("FX SMOKE FAIL");
  process.exit(1);
}
console.log("FX SMOKE OK");
process.exit(0);
