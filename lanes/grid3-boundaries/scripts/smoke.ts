/**
 * Boundaries lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Both tools + not-found paths against the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { boundaryTools } from "../src/tools.js";
import { MockBoundaryProvider } from "../src/providers/mock.js";

const server = buildServer(boundaryTools(new MockBoundaryProvider()), { name: "boundaries-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("get_boundary") || !toolNames.includes("point_in_admin")) failed = true;

const lagos = await client.callTool({ name: "get_boundary", arguments: { level: "state", name: "lagos" } });
const l = lagos.structuredContent as { name?: string; centroid?: { lat: number } } | undefined;
console.log("state ->", JSON.stringify(l).slice(0, 140));
if (l?.name !== "Lagos" || Math.abs((l?.centroid?.lat ?? 0) - 6.5244) > 0.001) failed = true;

const lga = await client.callTool({ name: "get_boundary", arguments: { level: "lga", name: "Eti-Osa" } });
const g = lga.structuredContent as { name?: string; level?: string } | undefined;
console.log("lga ->", JSON.stringify(g).slice(0, 140));
if (g?.name !== "Eti-Osa" || g?.level !== "lga") failed = true;

const pt = await client.callTool({ name: "point_in_admin", arguments: { lat: 6.43, lng: 3.42 } });
const p = pt.structuredContent as { state?: string; lga?: string; ward?: string | null } | undefined;
console.log("point ->", JSON.stringify(p));
if (p?.state !== "Lagos" || p?.lga !== "Eti-Osa" || p?.ward !== "Victoria Island") failed = true;

const miss = await client.callTool({ name: "get_boundary", arguments: { level: "state", name: "Atlantis" } });
console.log("not-found isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

console.log(failed ? "GRID3-BOUNDARIES SMOKE FAILED" : "GRID3-BOUNDARIES SMOKE OK");
process.exit(failed ? 1 : 0);
