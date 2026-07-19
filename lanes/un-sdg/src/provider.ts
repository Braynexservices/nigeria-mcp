/**
 * Selects the active SDG provider from env (SDG_PROVIDER, default "mock") via the core
 * registry. Adding another statistics source = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type SdgProvider } from "./schema.js";
import { MockSdgProvider } from "./providers/mock.js";
import { UnSdgProvider } from "./providers/unsdg.js";

export function getSdgProvider(key?: string): SdgProvider {
  const provider = key ?? providerKey("SDG_PROVIDER");
  return selectProvider<SdgProvider>("SDG", provider, {
    mock: () => new MockSdgProvider(),
    unsdg: () => new UnSdgProvider(),
  });
}
