#!/usr/bin/env node
/**
 * Bank lane stdio entrypoint — run this to add bank tools to Claude Code / Desktop.
 * Provider is chosen by BANK_PROVIDER (default "mock"; "paystack" needs PAYSTACK_SECRET_KEY).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { bankTools } from "./tools.js";
import { getBankProvider } from "./provider.js";

await startStdio(bankTools(getBankProvider()), { name: "nigeria-mcp-bank" });
