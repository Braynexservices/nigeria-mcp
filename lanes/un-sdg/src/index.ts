/**
 * @braynexservices/nigeria-mcp-un-sdg — UN SDG indicators lane for Nigeria. Exposes its
 * tools + providers for composition into the combined server (and the stdio entrypoint).
 */
export { sdgTools } from "./tools.js";
export { getSdgProvider } from "./provider.js";
export { MockSdgProvider } from "./providers/mock.js";
export { UnSdgProvider } from "./providers/unsdg.js";
export { SDG_ALIASES, NormalizedSdgSeries, SdgPoint, type SdgProvider } from "./schema.js";
export { SERIES, type FixtureSdgSeries } from "./fixtures.js";
