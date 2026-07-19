/**
 * UN SDG lane stdio entrypoint — adds the SDG indicator tool to Claude Code / Desktop.
 * Provider is chosen by SDG_PROVIDER (default "mock").
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { sdgTools } from "./tools.js";
import { getSdgProvider } from "./provider.js";

await startStdio(sdgTools(getSdgProvider()), { name: "nigeria-mcp-un-sdg" });
