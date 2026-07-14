/**
 * Mock bank provider — the default. Resolves NUBANs against deterministic fixtures so the
 * lane runs with zero signup. Implements the core BankProvider interface; swap via
 * BANK_PROVIDER env. */
import {
  type BankProvider,
  type BankRef,
  type NormalizedBankAccount,
  stamp,
  notFound,
} from "@braynexservices/nigeria-mcp-core";
import { ACCOUNTS, BANKS } from "../fixtures.js";

export class MockBankProvider implements BankProvider {
  readonly name = "mock";

  async resolve(accountNumber: string, bankCode: string): Promise<NormalizedBankAccount> {
    const acct = ACCOUNTS.find(
      (a) => a.accountNumber === accountNumber.trim() && a.bankCode === bankCode.trim(),
    );
    if (!acct) {
      notFound(
        `Account ${accountNumber} at bank ${bankCode}`,
        "Check the 10-digit NUBAN and bank code; call list_banks for valid codes.",
      );
    }
    const bankName = BANKS.find((b) => b.code === acct.bankCode)?.name;
    return stamp(
      {
        accountNumber: acct.accountNumber,
        accountName: acct.accountName,
        bankCode: acct.bankCode,
        bankName,
      },
      this.name,
    );
  }

  async listBanks(): Promise<BankRef[]> {
    return BANKS.map((b) => ({ name: b.name, code: b.code }));
  }
}
