/**
 * Paystack bank provider — live NUBAN resolution + bank list via Paystack's free
 * identity-verification endpoints (GET /bank/resolve, GET /bank). Auth = Bearer secret key
 * (free signup) read from config (PAYSTACK_SECRET_KEY); never hardcoded.
 *
 * Status: LIVE-validated against Paystack (test key) via scripts/live.ts — list_banks (255
 * banks) + resolve. 15s timeout + retry on 429/5xx. Bank list cached; account resolutions
 * (PII) are NEVER cached. Fails loudly with an actionable hint when the key is missing.
 */
import {
  type BankProvider,
  type BankRef,
  type NormalizedBankAccount,
  loadConfig,
  fetchJson,
  stamp,
  notFound,
  ToolError,
} from "@braynexservices/nigeria-mcp-core";

const PAYSTACK_BASE = "https://api.paystack.co";

interface PaystackResolveData {
  account_number: string;
  account_name: string;
  bank_id?: number;
}
interface PaystackBankData {
  name: string;
  code: string;
}
interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

export class PaystackBankProvider implements BankProvider {
  readonly name = "paystack";
  /** Bank list changes rarely — cache it for the process lifetime. */
  private bankCache?: BankRef[];

  constructor(private readonly secretKey = loadConfig().paystackSecretKey) {}

  private authHeader(): string {
    if (!this.secretKey) {
      throw new ToolError(
        "BANK_PROVIDER=paystack but PAYSTACK_SECRET_KEY is not set.",
        "Set PAYSTACK_SECRET_KEY (a free Paystack secret key) in your MCP client's env block, or set BANK_PROVIDER=mock.",
      );
    }
    return `Bearer ${this.secretKey}`;
  }

  private async get<T>(path: string): Promise<PaystackEnvelope<T>> {
    const { res, body } = await fetchJson(
      `${PAYSTACK_BASE}${path}`,
      { headers: { Authorization: this.authHeader() } },
      { service: "Paystack", fallbackHint: "set BANK_PROVIDER=mock" },
    );
    // Check the transport status BEFORE trusting the body: bad credentials must surface as an
    // auth error, not be laundered through Paystack's { status:false } envelope into "not found".
    if (res.status === 401 || res.status === 403) {
      throw new ToolError(
        `Paystack rejected the credentials (HTTP ${res.status}).`,
        "Check PAYSTACK_SECRET_KEY, or set BANK_PROVIDER=mock.",
      );
    }
    // Paystack returns its { status, message, data } envelope on success AND benign 4xx
    // (e.g. an unresolvable account), so a parsed body is authoritative — gate on body.status.
    if (!body) {
      throw new ToolError(
        `Paystack returned a non-JSON response (HTTP ${res.status}).`,
        "Retry shortly, or set BANK_PROVIDER=mock.",
      );
    }
    return body as PaystackEnvelope<T>;
  }

  async resolve(accountNumber: string, bankCode: string): Promise<NormalizedBankAccount> {
    const path = `/bank/resolve?account_number=${encodeURIComponent(
      accountNumber.trim(),
    )}&bank_code=${encodeURIComponent(bankCode.trim())}`;
    const body = await this.get<PaystackResolveData>(path);
    if (!body.status || !body.data) {
      // Paystack returns { status: false, message } for unresolvable accounts.
      notFound(
        `Account ${accountNumber} at bank ${bankCode}`,
        body.message || "Verify the 10-digit NUBAN and bank_code (call list_banks).",
      );
    }
    // bankName is optional enrichment — a bank-list hiccup must not sink a successful resolution.
    let bankName: string | undefined;
    try {
      bankName = (await this.listBanks()).find((b) => b.code === bankCode.trim())?.name;
    } catch {
      bankName = undefined;
    }
    return stamp(
      {
        accountNumber: body.data.account_number,
        accountName: body.data.account_name,
        bankCode: bankCode.trim(),
        bankName,
      },
      this.name,
    );
  }

  async listBanks(): Promise<BankRef[]> {
    if (this.bankCache) return this.bankCache;
    const body = await this.get<PaystackBankData[]>("/bank?currency=NGN");
    if (!body.status || !Array.isArray(body.data)) {
      throw new ToolError(
        "Failed to fetch the bank list from Paystack.",
        body.message || "Check PAYSTACK_SECRET_KEY + network, or set BANK_PROVIDER=mock.",
      );
    }
    this.bankCache = body.data.map((b) => ({ name: b.name, code: b.code }));
    return this.bankCache;
  }
}
