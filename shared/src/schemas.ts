/**
 * Normalized, agent-facing data contracts. The SAME shape is returned regardless of
 * which upstream provider served the request — this stability is the product.
 * This package is published publicly: it carries contracts for the lanes it ships with.
 */
import { z } from "zod";

/** Provenance fields stamped onto every normalized record. */
export const Provenance = {
  source: z.string().describe("Which provider/source served this record (e.g. 'mock', 'public', 'mono')"),
  retrievedAt: z.string().describe("ISO-8601 timestamp when the record was fetched"),
};

// ---------- Bank ----------
export const NormalizedBankAccount = z.object({
  accountNumber: z.string().describe("10-digit NUBAN"),
  accountName: z.string().describe("Registered account holder name"),
  bankCode: z.string(),
  bankName: z.string().optional(),
  ...Provenance,
});
export type NormalizedBankAccount = z.infer<typeof NormalizedBankAccount>;

// ---------- FX ----------
export const FxRate = z.object({
  base: z.string().describe("Base currency, e.g. NGN"),
  quote: z.string().describe("Quote currency, e.g. USD"),
  rate: z.number(),
  market: z.enum(["official", "parallel"]).describe("Official (CBN) or parallel ('aboki') market"),
  ...Provenance,
});
export type FxRate = z.infer<typeof FxRate>;

// ---------- Electricity / meter validation (READ-ONLY) ----------
// Validation/info only — never payment execution (NERC/CBN/AML). Customer PII not persisted.
export const NormalizedMeter = z.object({
  meterNumber: z.string().describe("Electricity meter number"),
  customerName: z.string().nullable().optional().describe("Registered customer name (PII — pass-through)"),
  address: z.string().nullable().optional().describe("Service address (PII — pass-through)"),
  disco: z.string().describe("Distribution company code, e.g. EKEDC / IKEDC / AEDC / PHED"),
  meterType: z.string().describe("prepaid | postpaid"),
  ...Provenance,
});
export type NormalizedMeter = z.infer<typeof NormalizedMeter>;

// ---------- Trade intelligence (public macro data, no PII) ----------
export const NormalizedTradeFlow = z.object({
  reporter: z.string().describe("Reporting country, e.g. Nigeria"),
  partner: z.string().describe("Trade partner country"),
  hsCode: z.string().describe("HS commodity code (or aggregate, e.g. TOTAL)"),
  commodity: z.string().describe("Commodity description"),
  flow: z.enum(["import", "export"]),
  period: z.string().describe("Reporting period — year (2024) or year-month (202403)"),
  year: z.number().describe("Reporting year"),
  valueUsd: z.number().describe("Primary trade value in USD"),
  cifValueUsd: z.number().nullable().optional().describe("CIF value in USD (imports), where reported"),
  fobValueUsd: z.number().nullable().optional().describe("FOB value in USD (exports), where reported"),
  netWeightKg: z.number().nullable().optional().describe("Net weight in kilograms, where reported"),
  quantity: z.number().nullable().optional().describe("Quantity in the reported unit, where available"),
  quantityUnit: z.string().nullable().optional().describe("Unit for quantity, e.g. 'N' (number of items), 'kg', 'l'"),
  ...Provenance,
});
export type NormalizedTradeFlow = z.infer<typeof NormalizedTradeFlow>;

export const NormalizedHsCode = z.object({
  query: z.string().describe("The product description that was classified"),
  hsCode: z.string().describe("Best-match HS code"),
  heading: z.string().describe("HS heading / description"),
  ...Provenance,
});
export type NormalizedHsCode = z.infer<typeof NormalizedHsCode>;
