/**
 * @braynexservices/nigeria-mcp-admin-divisions — states/LGAs reference lane (fully
 * offline). Exposes its tools + provider for composition into the combined server
 * (and the stdio entrypoint).
 */
export { adminDivisionsTools } from "./tools.js";
export { getAdminDivisionsProvider } from "./provider.js";
export { StaticAdminDivisionsProvider } from "./providers/static.js";
export { EXPECTED_STATE_COUNT, EXPECTED_TOTAL_LGAS, SAMPLE_STATE, SAMPLE_LGA } from "./fixtures.js";
export { NormalizedState, NormalizedLgas, type AdminDivisionsProvider } from "./schema.js";
