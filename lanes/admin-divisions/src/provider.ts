/**
 * Selects the active admin-divisions provider from env (ADMIN_DIVISIONS_PROVIDER,
 * default "static") via the core registry. This lane is fully offline — "static" is
 * both the default and the only entry; a future API-backed source = one import + one
 * registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type AdminDivisionsProvider } from "./schema.js";
import { StaticAdminDivisionsProvider } from "./providers/static.js";

export function getAdminDivisionsProvider(key?: string): AdminDivisionsProvider {
  const provider = key ?? providerKey("ADMIN_DIVISIONS_PROVIDER", "static");
  return selectProvider<AdminDivisionsProvider>("ADMIN_DIVISIONS", provider, {
    static: () => new StaticAdminDivisionsProvider(),
  });
}
