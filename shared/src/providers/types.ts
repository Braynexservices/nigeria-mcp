/**
 * The provider seam — the moat. Tools depend on these interfaces, never on a concrete
 * provider. Selecting/swapping a provider is one env var; adding one is one new file.
 * This package is published publicly: it carries interfaces for the lanes it ships with.
 */
import type {
  NormalizedBankAccount,
  FxRate,
  NormalizedMeter,
  NormalizedTradeFlow,
  NormalizedHsCode,
} from "../schemas.js";

export interface BankRef {
  name: string;
  code: string;
}

export interface BankProvider {
  readonly name: string;
  resolve(accountNumber: string, bankCode: string): Promise<NormalizedBankAccount>;
  listBanks(): Promise<BankRef[]>;
}

export interface FxProvider {
  readonly name: string;
  rates(base?: string, quote?: string): Promise<FxRate[]>;
}

export interface Disco {
  code: string;
  name: string;
}

/** Electricity meter provider. READ-ONLY by design — no pay/recharge methods (NERC/CBN/AML). */
export interface MeterProvider {
  readonly name: string;
  validate(meterNumber: string, disco: string, meterType: string): Promise<NormalizedMeter>;
  listDiscos(): Promise<Disco[]>;
}

/** Query for trade statistics. `commodity` is an HS code OR an aggregation level keyword. */
export interface TradeStatsQuery {
  flow: string; // "import" | "export"
  partner?: string; // country name / ISO / numeric code; omit for all partners
  commodity?: string; // HS code (e.g. "85", "2709") OR "total" | "chapters" | "headings" | "detailed"
  year?: number;
  frequency?: string; // "annual" (default) | "monthly"
  month?: number; // 1-12, required when frequency = "monthly"
}

/** Trade-intelligence provider. Wrap OPEN global APIs (UN Comtrade, WITS) — not NICIS II. */
export interface TradeProvider {
  readonly name: string;
  tradeStats(query: TradeStatsQuery): Promise<NormalizedTradeFlow[]>;
  classifyHs(productDescription: string): Promise<NormalizedHsCode>;
}
