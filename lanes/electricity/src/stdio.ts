#!/usr/bin/env node
/**
 * Electricity lane stdio entrypoint — adds meter-validation tools to Claude Code / Desktop.
 * Provider is chosen by ELECTRICITY_PROVIDER (default "mock"; "vtpass" is live — needs VTPASS_* keys).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { electricityTools } from "./tools.js";
import { getMeterProvider } from "./provider.js";

await startStdio(electricityTools(getMeterProvider()), { name: "nigeria-mcp-electricity" });
