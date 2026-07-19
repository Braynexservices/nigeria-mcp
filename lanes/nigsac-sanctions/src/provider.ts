/**
 * Selects the active sanctions provider from env (SANCTIONS_PROVIDER, default "nigsac" — the
 * LIVE register; mock is an explicit opt-in) via the core registry. Adding another list
 * source = one import + one registry entry.
 */
import { providerKey, selectProvider } from "@braynexservices/nigeria-mcp-core";
import { type SanctionsProvider } from "./schema.js";
import { MockSanctionsProvider } from "./providers/mock.js";
import { NigsacSanctionsProvider } from "./providers/nigsac.js";

export function getSanctionsProvider(key?: string): SanctionsProvider {
  // Default to the LIVE register, not mock. Unlike other lanes (where a mock default is a
  // harmless offline dev convenience), a sanctions tool that defaults to a 2-name synthetic
  // fixture would silently CLEAR every real name. Mock stays available as an explicit opt-in
  // (SANCTIONS_PROVIDER=mock) for offline dev/eval.
  const provider = key ?? providerKey("SANCTIONS_PROVIDER", "nigsac");
  return selectProvider<SanctionsProvider>("SANCTIONS", provider, {
    mock: () => new MockSanctionsProvider(),
    nigsac: () => new NigsacSanctionsProvider(),
  });
}
