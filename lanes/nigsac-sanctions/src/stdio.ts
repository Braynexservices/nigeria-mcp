#!/usr/bin/env node
/**
 * Sanctions lane stdio entrypoint — adds the screening tool to Claude Code / Desktop.
 * Provider is chosen by SANCTIONS_PROVIDER (default "nigsac" — the live register; set
 * SANCTIONS_PROVIDER=mock for an offline synthetic stub).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { sanctionsTools } from "./tools.js";
import { getSanctionsProvider } from "./provider.js";

await startStdio(sanctionsTools(getSanctionsProvider()), { name: "nigeria-mcp-nigsac-sanctions" });
