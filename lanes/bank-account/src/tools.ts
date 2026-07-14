/**
 * Bank-account MCP tools. Each is provider-agnostic — it calls the injected BankProvider
 * and returns the normalized schema as structuredContent. */
import { z } from "zod";
import { type ToolDef, type BankProvider, NormalizedBankAccount } from "@braynexservices/nigeria-mcp-core";

export function bankTools(provider: BankProvider): ToolDef[] {
  return [
    {
      name: "resolve_bank_account",
      title: "Resolve Nigerian bank account",
      description:
        "Resolve a Nigerian bank account (10-digit NUBAN + bank code) to its registered account name. " +
        "Use list_banks to look up a bank's code. Example: { account_number: '0123456789', bank_code: '058' }.",
      inputSchema: {
        account_number: z
          .string()
          .regex(/^\d{10}$/, "NUBAN must be exactly 10 digits")
          .describe("10-digit NUBAN account number"),
        bank_code: z
          .string()
          .min(3)
          .describe("Bank/NIP code (e.g. '058' for GTBank) — see list_banks"),
      },
      outputSchema: NormalizedBankAccount.shape,
      handler: async (args) => {
        const account = await provider.resolve(String(args.account_number), String(args.bank_code));
        return {
          content: [
            {
              type: "text",
              text: `${account.accountName} — ${account.accountNumber} @ ${account.bankName ?? account.bankCode}`,
            },
          ],
          structuredContent: account,
        };
      },
    },
    {
      name: "list_banks",
      title: "List Nigerian banks",
      description:
        "List supported Nigerian banks with their codes. Use the returned code as bank_code for resolve_bank_account.",
      inputSchema: {},
      outputSchema: { banks: z.array(z.object({ name: z.string(), code: z.string() })) },
      handler: async () => {
        const banks = await provider.listBanks();
        const text = banks.length
          ? banks.map((b) => `${b.name} (${b.code})`).join("\n")
          : "No banks available.";
        return { content: [{ type: "text", text }], structuredContent: { banks } };
      },
    },
  ];
}
