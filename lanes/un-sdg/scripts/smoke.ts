/**
 * UN SDG lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Alias path, raw-code path and unknown-series error vs the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { sdgTools } from "../src/tools.js";
import { MockSdgProvider } from "../src/providers/mock.js";

const server = buildServer(sdgTools(new MockSdgProvider()), { name: "sdg-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("get_sdg_indicator")) failed = true;

const alias = await client.callTool({ name: "get_sdg_indicator", arguments: { series: "extreme_poverty" } });
const a = alias.structuredContent as { seriesCode?: string; points?: Array<{ year: number; value: number | null }> } | undefined;
console.log("alias ->", JSON.stringify(a).slice(0, 200));
const p2020 = a?.points?.find((p) => p.year === 2020);
if (a?.seriesCode !== "SI_POV_DAY1" || p2020?.value !== 30.9) failed = true;

const raw = await client.callTool({ name: "get_sdg_indicator", arguments: { series: "EG_ACS_ELEC" } });
const r = raw.structuredContent as { seriesCode?: string } | undefined;
console.log("raw ->", JSON.stringify(r).slice(0, 140));
if (r?.seriesCode !== "EG_ACS_ELEC") failed = true;

const miss = await client.callTool({ name: "get_sdg_indicator", arguments: { series: "XX_NOPE_1" } });
console.log("unknown isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

console.log(failed ? "UN-SDG SMOKE FAILED" : "UN-SDG SMOKE OK");
process.exit(failed ? 1 : 0);
