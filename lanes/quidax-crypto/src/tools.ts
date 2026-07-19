/**
 * Crypto MCP tools. Provider-agnostic — each calls the injected CryptoProvider and
 * returns the normalized schema as structuredContent. Public market data only — read-only,
 * no PII, no trading.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import {
  type CryptoProvider,
  NormalizedCryptoTicker,
  NormalizedCryptoMarket,
} from "./schema.js";

export function cryptoTools(provider: CryptoProvider): ToolDef[] {
  return [
    {
      name: "get_crypto_ticker",
      title: "Get Nigerian Crypto Ticker",
      description:
        "Latest crypto ticker for a market pair on the Nigerian exchange (Quidax) — last traded price " +
        "plus 24h high/low/volume where reported. Prices are in the quote currency (e.g. btcngn = NGN " +
        "per 1 BTC). Public market data; informational, not trading advice.",
      inputSchema: {
        market: z.string().min(5).describe("Market pair, e.g. btcngn, ethngn, usdtngn"),
      },
      outputSchema: NormalizedCryptoTicker.shape,
      handler: async (args) => {
        const rec = await provider.getTicker(String(args.market).trim().toLowerCase());
        return {
          content: [
            {
              // Surface `source` in the human-readable text, not just structuredContent: with the
              // default mock provider this reads "… source: mock", so an agent can't present a
              // synthetic fixture price as a live market quote (source: quidax = live).
              type: "text",
              text: `${rec.base}/${rec.quote} last ${rec.last} ${rec.quote} (as of ${rec.at}, source: ${rec.source})`,
            },
          ],
          structuredContent: rec,
        };
      },
    },
    {
      name: "list_crypto_markets",
      title: "List Nigerian Crypto Markets",
      description:
        "List the market pairs available on the Nigerian exchange (Quidax), each split into base asset " +
        "and quote currency. Use a returned market id (e.g. btcngn) with get_crypto_ticker.",
      inputSchema: {},
      outputSchema: {
        markets: z.array(NormalizedCryptoMarket),
        count: z.number(),
      },
      handler: async () => {
        const markets = await provider.listMarkets();
        const preview = markets.slice(0, 10).map((m) => m.market).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `${markets.length} markets: ${preview}${markets.length > 10 ? ", …" : ""}`,
            },
          ],
          structuredContent: { markets, count: markets.length },
        };
      },
    },
  ];
}
