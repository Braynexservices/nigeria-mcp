/**
 * Selects the active bank provider from env (BANK_PROVIDER, default "mock") via the core
 * registry. Adding a fallback provider (mono, flutterwave…) = one import + one registry entry.
 */
import { loadConfig, selectProvider, type BankProvider } from "@braynexservices/nigeria-mcp-core";
import { MockBankProvider } from "./providers/mock.js";
import { PaystackBankProvider } from "./providers/paystack.js";

export function getBankProvider(key?: string): BankProvider {
  const provider = key ?? loadConfig().bankProvider;
  return selectProvider<BankProvider>("BANK", provider, {
    mock: () => new MockBankProvider(),
    paystack: () => new PaystackBankProvider(),
  });
}
