/**
 * @braynexservices/nigeria-mcp-grid3-boundaries — admin boundaries + reverse-geocode lane.
 * Exposes its tools + providers for composition into the combined server (and the stdio
 * entrypoint).
 */
export { boundaryTools } from "./tools.js";
export { getBoundaryProvider } from "./provider.js";
export { MockBoundaryProvider } from "./providers/mock.js";
export { Grid3BoundaryProvider } from "./providers/grid3.js";
export { BOUNDARIES, POINT_ADMIN, type FixtureBoundary, type FixturePointAdmin } from "./fixtures.js";
