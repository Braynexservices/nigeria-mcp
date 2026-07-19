/**
 * Selects the active crypto provider from env (CRYPTO_PROVIDER, default "mock") via
 * the core registry. Adding another exchange = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type CryptoProvider } from "./schema.js";
import { MockCryptoProvider } from "./providers/mock.js";
import { QuidaxCryptoProvider } from "./providers/quidax.js";

export function getCryptoProvider(key?: string): CryptoProvider {
  const provider = key ?? providerKey("CRYPTO_PROVIDER");
  return selectProvider<CryptoProvider>("CRYPTO", provider, {
    mock: () => new MockCryptoProvider(),
    quidax: () => new QuidaxCryptoProvider(),
  });
}
