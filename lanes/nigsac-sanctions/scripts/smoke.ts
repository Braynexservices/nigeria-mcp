/**
 * Sanctions lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Exact match, fuzzy match and CLEAR paths vs the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { sanctionsTools } from "../src/tools.js";
import { MockSanctionsProvider } from "../src/providers/mock.js";

const server = buildServer(sanctionsTools(new MockSanctionsProvider()), { name: "sanctions-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("screen_sanctions")) failed = true;

const exact = await client.callTool({ name: "screen_sanctions", arguments: { name: "IBRAHIM TEST DOE" } });
const e = exact.structuredContent as { status?: string; matches?: Array<{ similarity: number }> } | undefined;
console.log("exact ->", JSON.stringify(e).slice(0, 180));
if (e?.status !== "POTENTIAL_MATCH" || e?.matches?.[0]?.similarity !== 1) failed = true;

const fuzzy = await client.callTool({ name: "screen_sanctions", arguments: { name: "Ibrahim Doe" } });
const f = fuzzy.structuredContent as { status?: string; matches?: Array<{ similarity: number }> } | undefined;
console.log("fuzzy ->", JSON.stringify(f).slice(0, 180));
if (f?.status !== "POTENTIAL_MATCH" || (f?.matches?.[0]?.similarity ?? 0) < 0.5) failed = true;

const clear = await client.callTool({ name: "screen_sanctions", arguments: { name: "ADAEZE OKONKWO" } });
const c = clear.structuredContent as { status?: string; matches?: unknown[] } | undefined;
console.log("clear ->", JSON.stringify(c).slice(0, 140));
if (c?.status !== "CLEAR" || (c?.matches?.length ?? -1) !== 0) failed = true;

console.log(failed ? "NIGSAC-SANCTIONS SMOKE FAILED" : "NIGSAC-SANCTIONS SMOKE OK");
process.exit(failed ? 1 : 0);
