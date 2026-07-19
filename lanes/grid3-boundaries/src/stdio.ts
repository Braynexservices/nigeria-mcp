/**
 * Boundaries lane stdio entrypoint — adds boundary + reverse-geocode tools to Claude
 * Code / Desktop. Provider is chosen by BOUNDARY_PROVIDER (default "mock").
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { boundaryTools } from "./tools.js";
import { getBoundaryProvider } from "./provider.js";

await startStdio(boundaryTools(getBoundaryProvider()), { name: "nigeria-mcp-grid3-boundaries" });
