#!/usr/bin/env node
/**
 * Health-facility lane stdio entrypoint — adds facility-lookup tools to Claude Code /
 * Desktop. Provider is chosen by HEALTH_PROVIDER (default "mock").
 */
import { startStdio } from "@braynexservices/nigeria-mcp-core";
import { healthFacilityTools } from "./tools.js";
import { getHealthFacilityProvider } from "./provider.js";

await startStdio(healthFacilityTools(getHealthFacilityProvider()), { name: "nigeria-mcp-health-facility" });
