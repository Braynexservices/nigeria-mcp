/**
 * Health-facility lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Both tools + not-found path against the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { healthFacilityTools } from "../src/tools.js";
import { MockHealthFacilityProvider } from "../src/providers/mock.js";

const server = buildServer(healthFacilityTools(new MockHealthFacilityProvider()), { name: "health-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("find_facilities_near") || !toolNames.includes("get_facility")) failed = true;

const near = await client.callTool({
  name: "find_facilities_near",
  arguments: { lat: 6.44, lng: 3.41, radius_km: 10 },
});
const n = near.structuredContent as { facilities?: Array<{ id: string; distanceKm?: number | null }>; count?: number } | undefined;
console.log("near ->", JSON.stringify(n).slice(0, 200));
const hf001 = n?.facilities?.find((f) => f.id === "HF001");
if (!hf001 || typeof hf001.distanceKm !== "number") failed = true;

const one = await client.callTool({ name: "get_facility", arguments: { id: "HF001" } });
const o = one.structuredContent as { name?: string } | undefined;
console.log("facility ->", JSON.stringify(o).slice(0, 160));
if (o?.name !== "Island Maternity Hospital") failed = true;

const empty = await client.callTool({
  name: "find_facilities_near",
  arguments: { lat: 13.5, lng: 13.9, radius_km: 1 },
});
const e = empty.structuredContent as { count?: number } | undefined;
console.log("empty count ->", e?.count);
if (e?.count !== 0) failed = true;

const miss = await client.callTool({ name: "get_facility", arguments: { id: "HF999" } });
console.log("not-found isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

console.log(failed ? "HEALTH-FACILITY SMOKE FAILED" : "HEALTH-FACILITY SMOKE OK");
process.exit(failed ? 1 : 0);
