/**
 * Lane-local contracts for Nigerian crypto market data (Quidax).
 *
 * Rule: a lane's schemas + provider interface live HERE until the lane ships publicly.
 * Only shipped lanes' contracts are promoted into the public core package.
 *
 * Public market data only — no PII, no account access, no trading. Read-only tickers.
 */
import { z } from "zod";
import { Provenance } from "@braynexservices/nigeria-mcp-core";

export const NormalizedCryptoTicker = z.object({
  market: z.string().describe('Market pair identifier, e.g. "btcngn"'),
  base: z.string().describe('Base asset, e.g. "BTC"'),
  quote: z.string().describe('Quote currency, e.g. "NGN"'),
  last: z.number().describe("Last traded price in the quote currency"),
  high: z.number().nullable().describe("24h high in the quote currency, where reported"),
  low: z.number().nullable().describe("24h low in the quote currency, where reported"),
  volume: z.number().nullable().describe("24h traded volume in the base asset, where reported"),
  at: z.string().describe("ISO-8601 timestamp of the ticker snapshot"),
  ...Provenance,
});
export type NormalizedCryptoTicker = z.infer<typeof NormalizedCryptoTicker>;

export const NormalizedCryptoMarket = z.object({
  market: z.string().describe('Market pair identifier, e.g. "btcngn"'),
  base: z.string().describe('Base asset, e.g. "BTC"'),
  quote: z.string().describe('Quote currency, e.g. "NGN"'),
});
export type NormalizedCryptoMarket = z.infer<typeof NormalizedCryptoMarket>;

export interface CryptoProvider {
  readonly name: string;
  getTicker(market: string): Promise<NormalizedCryptoTicker>;
  listMarkets(): Promise<NormalizedCryptoMarket[]>;
}
