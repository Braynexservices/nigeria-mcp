#!/usr/bin/env node
/**
 * FX lane stdio entrypoint — run this to add FX tools to Claude Code / Desktop.
 * Provider is chosen by FX_PROVIDER (default "mock"; set "free" for live rates).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { fxTools } from "./tools.js";
import { getFxProvider } from "./provider.js";

await startStdio(fxTools(getFxProvider()), { name: "nigeria-fx-rates" });
