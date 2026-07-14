/**
 * FX MCP tools. Provider-agnostic — calls the injected FxProvider and returns the
 * normalized FxRate[] as structuredContent. */
import { z } from "zod";
import { type ToolDef, type FxProvider, FxRate } from "@braynexservices/nigeria-mcp-core";

export function fxTools(provider: FxProvider): ToolDef[] {
  return [
    {
      name: "get_fx_rates",
      title: "Get Nigerian Naira FX rates",
      description:
        "Get Naira (NGN) exchange rates vs major currencies — official (CBN) and parallel ('aboki') market where available. " +
        "Each rate means 1 {quote} = {rate} {base} (e.g. 1 USD = 1550 NGN). Defaults to all NGN pairs; pass quote to filter. " +
        "Parallel-market values are estimates, not official. Example: { quote: 'USD' }.",
      inputSchema: {
        base: z
          .string()
          .length(3)
          .optional()
          .describe("Base currency ISO-4217 code (default NGN)"),
        quote: z
          .string()
          .length(3)
          .optional()
          .describe("Filter to one quote currency, e.g. USD; omit for all pairs"),
      },
      outputSchema: { rates: z.array(FxRate) },
      handler: async (args) => {
        const base = args.base ? String(args.base) : undefined;
        const quote = args.quote ? String(args.quote) : undefined;
        const rates = await provider.rates(base, quote);
        const text = rates.length
          ? rates
              .map((r) => `1 ${r.quote} = ${r.rate.toLocaleString("en-US")} ${r.base} (${r.market})`)
              .join("\n")
          : "No FX rates for that pair. This lane returns NGN-base pairs (e.g. NGN vs USD/EUR/GBP).";
        return { content: [{ type: "text", text }], structuredContent: { rates } };
      },
    },
  ];
}
