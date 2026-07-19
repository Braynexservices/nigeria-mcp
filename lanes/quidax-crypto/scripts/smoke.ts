/**
 * Crypto lane end-to-end smoke over an in-memory MCP client<->server pair.
 * Both tools + the unknown-market error path against the mock provider.
 * Pins the canonical fixture: btcngn last = 98000000.
 * Run: npm run smoke (exits non-zero on failure)
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "@braynexservices/nigeria-mcp-core";
import { cryptoTools } from "../src/tools.js";
import { MockCryptoProvider } from "../src/providers/mock.js";

const server = buildServer(cryptoTools(new MockCryptoProvider()), { name: "quidax-crypto-smoke" });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke", version: "0.0.0" });
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

let failed = false;
const toolNames = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", toolNames.join(", "));
if (!toolNames.includes("get_crypto_ticker") || !toolNames.includes("list_crypto_markets")) failed = true;

const btc = await client.callTool({ name: "get_crypto_ticker", arguments: { market: "BTCNGN" } });
const t = btc.structuredContent as { market?: string; base?: string; quote?: string; last?: number } | undefined;
console.log("btcngn ->", JSON.stringify(t));
if (t?.market !== "btcngn" || t?.base !== "BTC" || t?.quote !== "NGN" || t?.last !== 98000000) failed = true;

const miss = await client.callTool({ name: "get_crypto_ticker", arguments: { market: "xyzngn" } });
console.log("unknown market isError ->", miss.isError === true);
if (miss.isError !== true) failed = true;

const list = await client.callTool({ name: "list_crypto_markets", arguments: {} });
const l = list.structuredContent as { markets?: { market: string }[]; count?: number } | undefined;
console.log("markets ->", JSON.stringify(l));
const marketIds = (l?.markets ?? []).map((m) => m.market);
if (
  l?.count !== 3 ||
  !marketIds.includes("btcngn") ||
  !marketIds.includes("ethngn") ||
  !marketIds.includes("usdtngn")
)
  failed = true;

console.log(failed ? "QUIDAX-CRYPTO SMOKE FAILED" : "QUIDAX-CRYPTO SMOKE OK");
process.exit(failed ? 1 : 0);
