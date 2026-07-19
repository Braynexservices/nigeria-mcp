/**
 * Selects the active IMF provider from env (IMF_PROVIDER, default "mock") via the core
 * registry. Adding another macro source = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type ImfProvider } from "./schema.js";
import { MockImfProvider } from "./providers/mock.js";
import { ImfWeoProvider } from "./providers/imf.js";

export function getImfProvider(key?: string): ImfProvider {
  const provider = key ?? providerKey("IMF_PROVIDER");
  return selectProvider<ImfProvider>("IMF", provider, {
    mock: () => new MockImfProvider(),
    imf: () => new ImfWeoProvider(),
  });
}
