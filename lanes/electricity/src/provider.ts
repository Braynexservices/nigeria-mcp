/**
 * Selects the active meter provider from env (ELECTRICITY_PROVIDER, default "mock") via the
 * core registry. Adding a confirmed read-only provider = one import + one registry entry.
 */
import { loadConfig, selectProvider, type MeterProvider } from "@braynexservices/nigeria-mcp-core";
import { MockMeterProvider } from "./providers/mock.js";
import { VtpassMeterProvider } from "./providers/vtpass.js";

export function getMeterProvider(key?: string): MeterProvider {
  const provider = key ?? loadConfig().electricityProvider;
  return selectProvider<MeterProvider>("ELECTRICITY", provider, {
    mock: () => new MockMeterProvider(),
    vtpass: () => new VtpassMeterProvider(),
  });
}
