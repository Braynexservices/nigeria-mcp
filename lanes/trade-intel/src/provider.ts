/**
 * Selects the active trade provider from env (TRADE_PROVIDER, default "mock") via the core
 * registry. Adding a validated source = one import + one registry entry.
 */
import { loadConfig, selectProvider, type TradeProvider } from "@braynexservices/nigeria-mcp-core";
import { MockTradeProvider } from "./providers/mock.js";
import { OpenDataTradeProvider } from "./providers/opendata.js";

export function getTradeProvider(key?: string): TradeProvider {
  const provider = key ?? loadConfig().tradeProvider;
  return selectProvider<TradeProvider>("TRADE", provider, {
    mock: () => new MockTradeProvider(),
    opendata: () => new OpenDataTradeProvider(),
  });
}
