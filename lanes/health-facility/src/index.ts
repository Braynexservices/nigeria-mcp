/**
 * @braynexservices/nigeria-mcp-health-facility — health facility lookup lane. Exposes its
 * tools + providers for composition into the combined server (and the stdio entrypoint).
 */
export { healthFacilityTools } from "./tools.js";
export { getHealthFacilityProvider } from "./provider.js";
export { MockHealthFacilityProvider } from "./providers/mock.js";
export { Grid3HealthFacilityProvider } from "./providers/grid3.js";
export { FACILITIES, type FixtureFacility } from "./fixtures.js";
