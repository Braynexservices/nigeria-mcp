/**
 * IMF WEO lane stdio entrypoint — adds Nigeria macro-series tools to Claude Code / Desktop.
 * Provider is chosen by IMF_PROVIDER (default "mock").
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { imfTools } from "./tools.js";
import { getImfProvider } from "./provider.js";

await startStdio(imfTools(getImfProvider()), { name: "nigeria-mcp-imf-weo" });
