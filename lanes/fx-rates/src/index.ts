/**
 * @braynexservices/nigeria-mcp-fx-rates — FX rates lane. Exposes its tools + providers for composition into
 * the combined server (and for direct use via the stdio entrypoint).
 */
export { fxTools } from "./tools.js";
export { getFxProvider } from "./provider.js";
export { MockFxProvider } from "./providers/mock.js";
export { FreeFxProvider } from "./providers/freeFx.js";
export { RATES, type FixtureRate } from "./fixtures.js";
