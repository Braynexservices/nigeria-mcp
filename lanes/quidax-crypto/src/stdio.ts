/**
 * Crypto lane stdio entrypoint — adds Quidax market-data tools to Claude Code / Desktop.
 * Provider is chosen by CRYPTO_PROVIDER (default "mock").
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { cryptoTools } from "./tools.js";
import { getCryptoProvider } from "./provider.js";

await startStdio(cryptoTools(getCryptoProvider()), { name: "nigeria-mcp-quidax-crypto" });
