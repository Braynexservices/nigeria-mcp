/**
 * Selects the active macro provider from env (MACRO_PROVIDER, default "mock") via
 * the core registry. Adding another macro source = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type MacroProvider } from "./schema.js";
import { MockMacroProvider } from "./providers/mock.js";
import { WorldBankMacroProvider } from "./providers/worldbank.js";

export function getMacroProvider(key?: string): MacroProvider {
  const provider = key ?? providerKey("MACRO_PROVIDER");
  return selectProvider<MacroProvider>("MACRO", provider, {
    mock: () => new MockMacroProvider(),
    worldbank: () => new WorldBankMacroProvider(),
  });
}
