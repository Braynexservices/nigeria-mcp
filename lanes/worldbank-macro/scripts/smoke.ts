/**
 * Macro lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Alias path (gdp -> NY.GDP.MKTP.CD, must include a positive 2023 point), raw-code path,
 * and unknown-indicator error path — all against the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { macroTools } from "../src/tools.js";
import { MockMacroProvider } from "../src/providers/mock.js";

interface SeriesOut {
  indicator?: string;
  label?: string;
  points?: { year: number; value: number | null }[];
}

const server = buildServer(macroTools(new MockMacroProvider()), { name: "worldbank-macro-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("get_macro_indicator")) failed = true;

// 1) Alias path: "gdp" must resolve to NY.GDP.MKTP.CD and carry a positive 2023 point.
const gdp = await client.callTool({ name: "get_macro_indicator", arguments: { indicator: "gdp" } });
const g = gdp.structuredContent as SeriesOut | undefined;
const g2023 = g?.points?.find((p) => p.year === 2023);
console.log("gdp ->", g?.indicator, "| 2023 =", g2023?.value);
if (g?.indicator !== "NY.GDP.MKTP.CD") failed = true;
if (!g2023 || typeof g2023.value !== "number" || g2023.value <= 0) failed = true;

// 2) Raw-code path: pass the World Bank code directly (no alias).
const growth = await client.callTool({
  name: "get_macro_indicator",
  arguments: { indicator: "NY.GDP.MKTP.KD.ZG", start_year: 2021, end_year: 2023 },
});
const gr = growth.structuredContent as SeriesOut | undefined;
console.log("raw code ->", gr?.indicator, "| points:", gr?.points?.length);
if (gr?.indicator !== "NY.GDP.MKTP.KD.ZG") failed = true;
if (!gr?.points?.length || gr.points.some((p) => p.year < 2021 || p.year > 2023)) failed = true;

// 3) Unknown indicator -> clean isError (mock hint lists the aliases).
const miss = await client.callTool({ name: "get_macro_indicator", arguments: { indicator: "XX.NOT.REAL" } });
console.log("unknown indicator isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

console.log(failed ? "WORLDBANK-MACRO SMOKE FAILED" : "WORLDBANK-MACRO SMOKE OK");
process.exit(failed ? 1 : 0);
