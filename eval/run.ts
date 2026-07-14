/**
 * Nigeria MCP eval runner. Loads every lane's tools (mock providers) into ONE in-memory
 * MCP server, parses eval/evaluation.xml, runs each case, and asserts the expectations
 * against structuredContent. Exits non-zero on any failure.
 *
 * Run: npm run eval   (from repo root). Requires @braynexservices/nigeria-mcp-core to be built (lanes
 * import its dist); lane tools are read from src via tsx.
 */
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer, type ToolDef } from "@braynexservices/nigeria-mcp-core";

import { bankTools } from "../lanes/bank-account/src/tools.js";
import { MockBankProvider } from "../lanes/bank-account/src/providers/mock.js";
import { fxTools } from "../lanes/fx-rates/src/tools.js";
import { MockFxProvider } from "../lanes/fx-rates/src/providers/mock.js";
import { electricityTools } from "../lanes/electricity/src/tools.js";
import { MockMeterProvider } from "../lanes/electricity/src/providers/mock.js";
import { tradeTools } from "../lanes/trade-intel/src/tools.js";
import { MockTradeProvider } from "../lanes/trade-intel/src/providers/mock.js";

interface Expectation {
  path: string;
  value: string;
}
interface EvalCase {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  expects: Expectation[];
}

/** Minimal parser for the controlled evaluation.xml format (uses matchAll, no eval/exec). */
function parseCases(xml: string): EvalCase[] {
  const cases: EvalCase[] = [];
  for (const m of xml.matchAll(/<case\s+id="([^"]+)">([\s\S]*?)<\/case>/g)) {
    const body = m[2];
    const tool = body.match(/<tool>([\s\S]*?)<\/tool>/)?.[1]?.trim() ?? "";
    const argsRaw = body.match(/<args>([\s\S]*?)<\/args>/)?.[1]?.trim() ?? "{}";
    const expects: Expectation[] = [];
    for (const e of body.matchAll(/<expect\s+path="([^"]+)">([\s\S]*?)<\/expect>/g)) {
      expects.push({ path: e[1], value: e[2].trim() });
    }
    cases.push({ id: m[1], tool, args: JSON.parse(argsRaw), expects });
  }
  return cases;
}

/** Resolve a dot path supporting numeric array indices and a trailing `.length`. */
function resolvePath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur == null) return undefined;
    if (seg === "length" && Array.isArray(cur)) return cur.length;
    cur = /^\d+$/.test(seg)
      ? (cur as unknown[])[Number(seg)]
      : (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

const tools: ToolDef[] = [
  ...bankTools(new MockBankProvider()),
  ...fxTools(new MockFxProvider()),
  ...electricityTools(new MockMeterProvider()),
  ...tradeTools(new MockTradeProvider()),
];

const server = buildServer(tools, { name: "nigeria-mcp-eval" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "eval", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

const toolCount = (await client.listTools()).tools.length;
const xml = readFileSync(new URL("./evaluation.xml", import.meta.url), "utf8");
const cases = parseCases(xml);

let passed = 0;
const failures: string[] = [];

for (const c of cases) {
  const res = await client.callTool({ name: c.tool, arguments: c.args });
  const misses: string[] = [];
  if (res.isError) {
    misses.push("tool returned isError");
  } else {
    for (const exp of c.expects) {
      const actual = resolvePath(res.structuredContent, exp.path);
      if (String(actual) !== exp.value) {
        misses.push(`${exp.path}: expected "${exp.value}", got "${String(actual)}"`);
      }
    }
  }
  if (misses.length === 0) {
    passed++;
    console.log(`  PASS  ${c.id} (${c.tool})`);
  } else {
    failures.push(`${c.id}: ${misses.join("; ")}`);
    console.log(`  FAIL  ${c.id} (${c.tool}) — ${misses.join("; ")}`);
  }
}

await client.close();
await server.close();

console.log(`\neval: ${passed}/${cases.length} cases passed across ${toolCount} tools`);
if (failures.length) {
  console.error("EVAL FAIL");
  process.exit(1);
}
console.log("EVAL OK");
process.exit(0);
