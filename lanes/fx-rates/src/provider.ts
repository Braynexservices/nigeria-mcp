/**
 * Selects the active FX provider from env (FX_PROVIDER, default "mock") via the core
 * registry. Adding a validated free/paid source = one import + one registry entry.
 */
import { loadConfig, selectProvider, type FxProvider } from "@braynexservices/nigeria-mcp-core";
import { MockFxProvider } from "./providers/mock.js";
import { FreeFxProvider } from "./providers/freeFx.js";

export function getFxProvider(key?: string): FxProvider {
  const provider = key ?? loadConfig().fxProvider;
  return selectProvider<FxProvider>("FX", provider, {
    mock: () => new MockFxProvider(),
    free: () => new FreeFxProvider(),
  });
}
