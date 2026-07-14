/**
 * Electricity lane end-to-end smoke test over an in-memory MCP client<->server pair.
 * Exercises both tools + the wrong-type / not-found error paths against the mock provider.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { electricityTools } from "../src/tools.js";
import { MockMeterProvider } from "../src/providers/mock.js";

const server = buildServer(electricityTools(new MockMeterProvider()), { name: "electricity-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));

const discosRes = await client.callTool({ name: "list_discos", arguments: {} });
const discos = (discosRes.structuredContent as { discos: { code: string }[] }).discos;
console.log("list_discos count ->", discos.length);

const valid = await client.callTool({
  name: "validate_meter",
  arguments: { meter_number: "45010101010", disco: "ekedc", meter_type: "prepaid" }, // lowercase disco -> normalize
});
const meter = valid.structuredContent as
  | { customerName?: string; disco?: string; meterType?: string; source?: string }
  | undefined;
console.log("validate ->", JSON.stringify(meter));

const wrongType = await client.callTool({
  name: "validate_meter",
  arguments: { meter_number: "45010101010", disco: "EKEDC", meter_type: "postpaid" }, // it's prepaid
});
console.log("wrong-type isError ->", wrongType.isError === true);

const missing = await client.callTool({
  name: "validate_meter",
  arguments: { meter_number: "00000000000", disco: "EKEDC", meter_type: "prepaid" },
});
console.log("not-found isError ->", missing.isError === true);

await client.close();
await server.close();

const ok =
  toolNames.length === 2 &&
  toolNames.includes("validate_meter") &&
  toolNames.includes("list_discos") &&
  discos.length === 6 &&
  meter?.customerName === "ADAEZE OKONKWO" &&
  meter?.disco === "EKEDC" &&
  meter?.meterType === "prepaid" &&
  meter?.source === "mock" &&
  wrongType.isError === true &&
  missing.isError === true;

if (!ok) {
  console.error("ELECTRICITY SMOKE FAIL");
  process.exit(1);
}
console.log("ELECTRICITY SMOKE OK");
process.exit(0);
