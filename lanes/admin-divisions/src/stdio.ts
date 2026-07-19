/**
 * Admin-divisions lane stdio entrypoint — adds states/LGAs tools to Claude Code / Desktop.
 * Provider is chosen by ADMIN_DIVISIONS_PROVIDER (default "static"; the lane is offline).
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { adminDivisionsTools } from "./tools.js";
import { getAdminDivisionsProvider } from "./provider.js";

await startStdio(adminDivisionsTools(getAdminDivisionsProvider()), { name: "nigeria-mcp-admin-divisions" });
