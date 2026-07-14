/**
 * Trade-intelligence MCP tools. Provider-agnostic — each calls the injected TradeProvider
 * and returns the normalized schema. Public macro data (no PII).
 */
import { z } from "zod";
import { type ToolDef, type TradeProvider, NormalizedTradeFlow, NormalizedHsCode } from "@braynexservices/nigeria-mcp-core";

export function tradeTools(provider: TradeProvider): ToolDef[] {
  return [
    {
      name: "get_trade_stats",
      title: "Get Nigeria trade statistics",
      description:
        "Nigeria import/export trade statistics (UN Comtrade). Returns value (USD, plus CIF/FOB), " +
        "net weight and quantity where reported. `flow` is required. Filter by `partner` (country), " +
        "`year`, and `frequency` (annual or monthly + `month`). `commodity` accepts an HS code " +
        "(e.g. '85', '2709') OR a breakdown level: 'total' (default), 'chapters' (by HS chapter), " +
        "'headings' (4-digit), 'detailed' (6-digit). Omit `partner` to rank all partners by value. " +
        "Examples: { flow:'import', partner:'China', commodity:'chapters' } · " +
        "{ flow:'export', commodity:'2709', frequency:'monthly', year:2024, month:3 }.",
      inputSchema: {
        flow: z.enum(["import", "export"]).describe("Trade direction"),
        partner: z.string().optional().describe("Partner country (name/ISO/code); omit for all partners"),
        commodity: z
          .string()
          .optional()
          .describe("HS code (e.g. 85, 2709) OR level: total | chapters | headings | detailed"),
        year: z.number().int().optional().describe("Reporting year, e.g. 2024 (annual data lags ~1–2y)"),
        frequency: z.enum(["annual", "monthly"]).optional().describe("Default annual"),
        month: z.number().int().min(1).max(12).optional().describe("Month 1–12, required when frequency=monthly"),
      },
      outputSchema: { flows: z.array(NormalizedTradeFlow) },
      handler: async (args) => {
        const flows = await provider.tradeStats({
          flow: String(args.flow),
          partner: args.partner ? String(args.partner) : undefined,
          commodity: args.commodity ? String(args.commodity) : undefined,
          year: args.year !== undefined ? Number(args.year) : undefined,
          frequency: args.frequency ? String(args.frequency) : undefined,
          month: args.month !== undefined ? Number(args.month) : undefined,
        });
        const text = flows.length
          ? flows
              .map((f) => {
                const wt = f.netWeightKg ? `, ${Math.round(f.netWeightKg).toLocaleString("en-US")} kg` : "";
                const qty = f.quantity ? `, ${Math.round(f.quantity).toLocaleString("en-US")} ${f.quantityUnit ?? "units"}` : "";
                return `${f.flow} ${f.commodity} (HS ${f.hsCode}) ${f.reporter}↔${f.partner} ${f.period}: $${f.valueUsd.toLocaleString("en-US")}${wt}${qty}`;
              })
              .join("\n")
          : "No trade flows match those filters.";
        return { content: [{ type: "text", text }], structuredContent: { flows } };
      },
    },
    {
      name: "classify_hs",
      title: "Classify a product to an HS code",
      description:
        "Suggest the Harmonized System (HS) code for a product description. " +
        "Example: { product_description: 'imported rice' } → HS 1006.",
      inputSchema: {
        product_description: z.string().min(2).describe("Free-text product description"),
      },
      outputSchema: NormalizedHsCode.shape,
      handler: async (args) => {
        const c = await provider.classifyHs(String(args.product_description));
        return {
          content: [{ type: "text", text: `"${c.query}" → HS ${c.hsCode} (${c.heading})` }],
          structuredContent: c,
        };
      },
    },
  ];
}
