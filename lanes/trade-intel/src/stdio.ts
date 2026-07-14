#!/usr/bin/env node
/**
 * Trade-intel lane stdio entrypoint — adds trade-stats + HS-classification tools to Claude
 * Code / Desktop. Provider is chosen by TRADE_PROVIDER (default "mock"; "opendata" is live — free/keyless UN Comtrade).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { tradeTools } from "./tools.js";
import { getTradeProvider } from "./provider.js";

await startStdio(tradeTools(getTradeProvider()), { name: "nigeria-trade-intel" });
