/**
 * Admin-divisions lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Both tools + the not-found error path against the static (bundled) provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { adminDivisionsTools } from "../src/tools.js";
import { StaticAdminDivisionsProvider } from "../src/providers/static.js";
import { EXPECTED_STATE_COUNT, EXPECTED_TOTAL_LGAS, SAMPLE_LGA, SAMPLE_STATE } from "../src/fixtures.js";

const server = buildServer(adminDivisionsTools(new StaticAdminDivisionsProvider()), {
  name: "admin-divisions-smoke",
});
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("list_states") || !toolNames.includes("get_lgas")) failed = true;

const states = await client.callTool({ name: "list_states", arguments: {} });
const s = states.structuredContent as
  | { count?: number; states?: { state: string; lgaCount: number }[] }
  | undefined;
const totalLgas = s?.states?.reduce((n, x) => n + x.lgaCount, 0);
console.log(`list_states -> count: ${s?.count}, total LGAs: ${totalLgas}`);
if (s?.count !== EXPECTED_STATE_COUNT || s?.states?.length !== EXPECTED_STATE_COUNT) failed = true;
if (totalLgas !== EXPECTED_TOTAL_LGAS) failed = true;
if (!s?.states?.some((x) => x.state === "FCT")) failed = true;

const lagos = await client.callTool({
  name: "get_lgas",
  arguments: { state: SAMPLE_STATE.toLowerCase() }, // case-insensitive lookup
});
const l = lagos.structuredContent as { state?: string; lgas?: string[] } | undefined;
console.log(`get_lgas("${SAMPLE_STATE.toLowerCase()}") -> ${l?.state}, ${l?.lgas?.length} LGAs`);
if (l?.state !== SAMPLE_STATE || !l?.lgas?.includes(SAMPLE_LGA)) failed = true;

const miss = await client.callTool({ name: "get_lgas", arguments: { state: "Atlantis" } });
console.log("get_lgas not-found isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

console.log(failed ? "ADMIN-DIVISIONS SMOKE FAILED" : "ADMIN-DIVISIONS SMOKE OK");
process.exit(failed ? 1 : 0);
