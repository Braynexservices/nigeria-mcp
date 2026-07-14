/**
 * Mock FX fixtures — deterministic NGN rates so the lane (and eval) work with zero signup.
 * NOT live rates: do not quote these as real. Each entry means 1 {quote} = {rate} {base},
 * i.e. how many Naira buy one unit of the quote currency — the colloquial NG phrasing
 * ("dollar is 1,550"). Parallel ('aboki') values are higher than official, as in reality.
 */
export interface FixtureRate {
  base: string;
  quote: string;
  rate: number;
  market: "official" | "parallel";
}

export const RATES: FixtureRate[] = [
  { base: "NGN", quote: "USD", rate: 1550.0, market: "official" },
  { base: "NGN", quote: "USD", rate: 1610.0, market: "parallel" },
  { base: "NGN", quote: "EUR", rate: 1680.0, market: "official" },
  { base: "NGN", quote: "EUR", rate: 1745.0, market: "parallel" },
  { base: "NGN", quote: "GBP", rate: 1965.0, market: "official" },
  { base: "NGN", quote: "GBP", rate: 2040.0, market: "parallel" },
];
