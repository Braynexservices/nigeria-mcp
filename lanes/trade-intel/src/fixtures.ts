/**
 * Mock trade-intelligence fixtures — deterministic Nigeria trade flows + a tiny HS-code
 * lookup so the lane (and eval) work with zero signup. NOT live figures: illustrative only,
 * do not quote as real statistics. Live path wraps OPEN global APIs (UN Comtrade / WITS).
 */
export interface FixtureTradeFlow {
  reporter: string;
  partner: string;
  hsCode: string;
  commodity: string;
  flow: "import" | "export";
  year: number;
  valueUsd: number;
  netWeightKg?: number;
  quantity?: number;
  quantityUnit?: string;
}

export const TRADE_FLOWS: FixtureTradeFlow[] = [
  { reporter: "Nigeria", partner: "India", hsCode: "2709", commodity: "Crude petroleum oils", flow: "export", year: 2023, valueUsd: 10_200_000_000, netWeightKg: 13_500_000_000 },
  { reporter: "Nigeria", partner: "Spain", hsCode: "2709", commodity: "Crude petroleum oils", flow: "export", year: 2023, valueUsd: 7_800_000_000, netWeightKg: 10_300_000_000 },
  { reporter: "Nigeria", partner: "Netherlands", hsCode: "2709", commodity: "Crude petroleum oils", flow: "export", year: 2024, valueUsd: 6_500_000_000 },
  { reporter: "Nigeria", partner: "China", hsCode: "8517", commodity: "Telephone sets & communication apparatus", flow: "import", year: 2023, valueUsd: 3_400_000_000, quantity: 42_000_000, quantityUnit: "N" },
  { reporter: "Nigeria", partner: "China", hsCode: "1006", commodity: "Rice", flow: "import", year: 2023, valueUsd: 1_200_000_000, netWeightKg: 1_900_000_000 },
  { reporter: "Nigeria", partner: "United States", hsCode: "8703", commodity: "Motor cars", flow: "import", year: 2024, valueUsd: 900_000_000, quantity: 38_000, quantityUnit: "N" },
];

export interface FixtureHsCode {
  keyword: string;
  hsCode: string;
  heading: string;
}

// Order matters: first keyword that appears as a whole word in the query wins.
export const HS_CODES: FixtureHsCode[] = [
  { keyword: "crude", hsCode: "2709", heading: "Petroleum oils, crude" },
  { keyword: "petroleum", hsCode: "2709", heading: "Petroleum oils, crude" },
  { keyword: "rice", hsCode: "1006", heading: "Rice" },
  { keyword: "cocoa", hsCode: "1801", heading: "Cocoa beans, whole or broken" },
  { keyword: "phone", hsCode: "8517", heading: "Telephone sets and communication apparatus" },
  { keyword: "car", hsCode: "8703", heading: "Motor cars for the transport of persons" },
];
