/**
 * Mock crypto fixtures — deterministic data so the lane and its own tests run with
 * zero signup. NOT live Quidax prices; values are synthetic but plausible.
 * Canonical record: btcngn with last = 98000000 (98M NGN) — the smoke test pins it.
 */
export interface FixtureTicker {
  market: string;
  base: string;
  quote: string;
  last: number;
  high?: number;
  low?: number;
  volume?: number;
}

export const TICKERS: FixtureTicker[] = [
  { market: "btcngn", base: "BTC", quote: "NGN", last: 98000000, high: 99500000, low: 96750000, volume: 0.4218 },
  { market: "ethngn", base: "ETH", quote: "NGN", last: 5200000, high: 5340000, low: 5085000, volume: 3.62 },
  { market: "usdtngn", base: "USDT", quote: "NGN", last: 1480, high: 1496, low: 1471, volume: 18250 },
];
