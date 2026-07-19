/**
 * Selects the active boundary provider from env (BOUNDARY_PROVIDER, default "mock") via
 * the core registry. Adding another geodata source = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type BoundaryProvider } from "./schema.js";
import { MockBoundaryProvider } from "./providers/mock.js";
import { Grid3BoundaryProvider } from "./providers/grid3.js";

export function getBoundaryProvider(key?: string): BoundaryProvider {
  const provider = key ?? providerKey("BOUNDARY_PROVIDER");
  return selectProvider<BoundaryProvider>("BOUNDARY", provider, {
    mock: () => new MockBoundaryProvider(),
    grid3: () => new Grid3BoundaryProvider(),
  });
}
