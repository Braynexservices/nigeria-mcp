/**
 * IMF WEO lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Alias path, raw-code path and unknown-indicator error vs the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { imfTools } from "../src/tools.js";
import { MockImfProvider } from "../src/providers/mock.js";

const server = buildServer(imfTools(new MockImfProvider()), { name: "imf-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("get_imf_projection")) failed = true;

const alias = await client.callTool({ name: "get_imf_projection", arguments: { indicator: "gdp_growth" } });
const a = alias.structuredContent as { indicator?: string; points?: Array<{ year: number; value: number | null }> } | undefined;
console.log("alias ->", JSON.stringify(a).slice(0, 200));
const p2025 = a?.points?.find((p) => p.year === 2025);
if (a?.indicator !== "NGDP_RPCH" || p2025?.value !== 3.2) failed = true;

const raw = await client.callTool({ name: "get_imf_projection", arguments: { indicator: "PCPIPCH" } });
const r = raw.structuredContent as { indicator?: string } | undefined;
console.log("raw ->", JSON.stringify(r).slice(0, 140));
if (r?.indicator !== "PCPIPCH") failed = true;

const miss = await client.callTool({ name: "get_imf_projection", arguments: { indicator: "NOPE_XYZ" } });
console.log("unknown isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

console.log(failed ? "IMF-WEO SMOKE FAILED" : "IMF-WEO SMOKE OK");
process.exit(failed ? 1 : 0);
