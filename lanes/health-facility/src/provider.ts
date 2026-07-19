/**
 * Selects the active health facility provider from env (HEALTH_PROVIDER, default "mock")
 * via the core registry. Adding another source = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type HealthFacilityProvider } from "./schema.js";
import { MockHealthFacilityProvider } from "./providers/mock.js";
import { Grid3HealthFacilityProvider } from "./providers/grid3.js";

export function getHealthFacilityProvider(key?: string): HealthFacilityProvider {
  const provider = key ?? providerKey("HEALTH_PROVIDER");
  return selectProvider<HealthFacilityProvider>("HEALTH", provider, {
    mock: () => new MockHealthFacilityProvider(),
    grid3: () => new Grid3HealthFacilityProvider(),
  });
}
