/**
 * Mock bank fixtures — deterministic NUBAN → account-name data + a Nigerian bank list so
 * the lane (and eval) work with zero signup. NOT real account records. Replace with the
 * Paystack adapter for live resolution. Bank codes are real NIP/CBN codes.
 */
export interface FixtureBank {
  name: string;
  code: string;
}

export interface FixtureAccount {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}

/** Common Nigerian banks (NIP codes). Real codes; used by the mock + list_banks. */
export const BANKS: FixtureBank[] = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Zenith Bank", code: "057" },
  { name: "Kuda Microfinance Bank", code: "50211" },
];

/**
 * Mock NUBANs — deterministic fixtures for offline/mock mode. NOT real accounts.
 */
export const ACCOUNTS: FixtureAccount[] = [
  { accountNumber: "0123456789", bankCode: "058", accountName: "ADAEZE OKONKWO" },
  { accountNumber: "1234567890", bankCode: "044", accountName: "TUNDE BAKARE" },
  { accountNumber: "2345678901", bankCode: "057", accountName: "PALMVIEW LOGISTICS LIMITED" },
  { accountNumber: "9876543210", bankCode: "033", accountName: "IBRAHIM SANI" },
];
