/**
 * Macro lane stdio entrypoint — adds World Bank macro tools to Claude Code / Desktop.
 * Provider is chosen by MACRO_PROVIDER (default "mock"; "worldbank" is live + keyless).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { macroTools } from "./tools.js";
import { getMacroProvider } from "./provider.js";

await startStdio(macroTools(getMacroProvider()), { name: "nigeria-mcp-worldbank-macro" });
