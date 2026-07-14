/**
 * End-to-end smoke test of the core over an in-memory MCP client<->server pair.
 * Proves: server builds, tools list, ping calls and returns structuredContent.
 * Run: npm run smoke   (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer, pingTool } from "../src/server.js";

const server = buildServer([pingTool]);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });

await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const listed = await client.listTools();
const names = listed.tools.map((t) => t.name);
console.log("tools:", names.join(", ") || "(none)");

const result = await client.callTool({ name: "ping", arguments: {} });
console.log("ping ->", JSON.stringify(result.structuredContent ?? result.content));

await client.close();
await server.close();

const pong = (result.structuredContent as { pong?: boolean } | undefined)?.pong === true;
if (!names.includes("ping") || !pong) {
  console.error("SMOKE FAIL");
  process.exit(1);
}
console.log("SMOKE OK");
process.exit(0);
