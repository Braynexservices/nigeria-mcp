/**
 * Trade-intel lane end-to-end smoke test over an in-memory MCP client<->server pair.
 * Exercises both tools (filtered stats + HS classify) + the not-found path against mock.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { tradeTools } from "../src/tools.js";
import { MockTradeProvider } from "../src/providers/mock.js";

const server = buildServer(tradeTools(new MockTradeProvider()), { name: "trade-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));

const exports = await client.callTool({ name: "get_trade_stats", arguments: { flow: "export" } });
const exportFlows = (exports.structuredContent as {
  flows: { flow: string; period?: string; fobValueUsd?: number | null; netWeightKg?: number | null }[];
}).flows;
console.log("export flows ->", exportFlows.length, "| top:", JSON.stringify(exportFlows[0]).slice(0, 120));

const chinaImports = await client.callTool({
  name: "get_trade_stats",
  arguments: { flow: "import", partner: "China" },
});
const chinaFlows = (chinaImports.structuredContent as { flows: unknown[] }).flows;
console.log("China import flows ->", chinaFlows.length);

// new capability: a commodity *level* keyword is accepted (not treated as an HS code)
const breakdown = await client.callTool({
  name: "get_trade_stats",
  arguments: { flow: "import", commodity: "chapters" },
});
const breakdownFlows = (breakdown.structuredContent as { flows: unknown[] }).flows;
console.log("import (chapters level) flows ->", breakdownFlows.length, "| isError", breakdown.isError === true);

const hs = await client.callTool({
  name: "classify_hs",
  arguments: { product_description: "imported rice from Asia" },
});
const hsCode = (hs.structuredContent as { hsCode?: string; source?: string } | undefined);
console.log("classify ->", JSON.stringify(hsCode));

const unknown = await client.callTool({
  name: "classify_hs",
  arguments: { product_description: "zxqw nonsense widget" },
});
console.log("classify-not-found isError ->", unknown.isError === true);

await client.close();
await server.close();

const ok =
  toolNames.length === 2 &&
  toolNames.includes("get_trade_stats") &&
  toolNames.includes("classify_hs") &&
  exportFlows.length === 3 &&
  exportFlows.every((f) => f.flow === "export") &&
  // new fields present + sorted by value (top crude export carries FOB value + period + weight)
  exportFlows[0]?.period === "2023" &&
  typeof exportFlows[0]?.fobValueUsd === "number" &&
  typeof exportFlows[0]?.netWeightKg === "number" &&
  chinaFlows.length === 2 &&
  breakdown.isError !== true &&
  breakdownFlows.length === 3 &&
  hsCode?.hsCode === "1006" &&
  hsCode?.source === "mock" &&
  unknown.isError === true;

if (!ok) {
  console.error("TRADE SMOKE FAIL");
  process.exit(1);
}
console.log("TRADE SMOKE OK");
process.exit(0);
