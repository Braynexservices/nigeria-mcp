/**
 * @braynexservices/nigeria-mcp-electricity — READ-ONLY meter-validation lane. Exposes its tools + providers
 * for composition into the combined server (and the stdio entrypoint).
 */
export { electricityTools } from "./tools.js";
export { getMeterProvider } from "./provider.js";
export { MockMeterProvider } from "./providers/mock.js";
export { VtpassMeterProvider } from "./providers/vtpass.js";
export { DISCOS, METERS, type FixtureDisco, type FixtureMeter } from "./fixtures.js";
