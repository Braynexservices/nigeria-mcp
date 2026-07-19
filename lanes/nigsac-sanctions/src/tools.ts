/**
 * Sanctions-screening MCP tool. Provider-agnostic — calls the injected SanctionsProvider
 * and returns the normalized screen as structuredContent. A result is a SIGNAL for
 * human review, not a legal determination.
 */
import { z } from "zod";
import { type ToolDef } from "@braynexservices/nigeria-mcp-core";
import { type SanctionsProvider, NormalizedSanctionsScreen } from "./schema.js";

export function sanctionsTools(provider: SanctionsProvider): ToolDef[] {
  return [
    {
      name: "screen_sanctions",
      title: "Screen a name against Nigerian sanctions lists",
      description:
        "Screen a person or company name against the official NIGSAC (Nigeria Sanctions Committee) " +
        "list of Nigerian designations — both individuals and entities. Returns CLEAR or " +
        "POTENTIAL_MATCH with candidates and similarity scores. Best-effort FUZZY name matching " +
        "(diacritic-folded, transliteration-tolerant); it over-flags on purpose and is a screening " +
        "signal for human review, NOT a legal determination or your sole compliance control. Scope: " +
        "the NIGERIAN list only — a CLEAR result does not mean the subject is unsanctioned elsewhere " +
        "(the UN consolidated list is not screened here). Default data source is the LIVE NIGSAC " +
        "register; set SANCTIONS_PROVIDER=mock for an offline synthetic stub. Example: " +
        "{ name: 'Ibrahim Test Doe' }.",
      inputSchema: {
        name: z.string().min(3).max(256).describe("Person or company name to screen"),
      },
      outputSchema: NormalizedSanctionsScreen.shape,
      handler: async (args) => {
        const rec = await provider.screen(String(args.name));
        // Surface source + list version in the text so a mock/offline screen is never mistaken
        // for the live register, and the caller sees how fresh the list snapshot is.
        const provenance = `source: ${rec.source}${rec.listVersion ? `, list ${rec.listVersion}` : ""}`;
        const more = rec.matches.length > 3 ? `; +${rec.matches.length - 3} more` : "";
        const text =
          rec.status === "CLEAR"
            ? `"${rec.query}" — CLEAR: no candidate matches on the NIGSAC Nigerian list (${provenance}). Not a legal clearance; covers the Nigerian list only.`
            : `"${rec.query}" — POTENTIAL_MATCH: ${rec.matches
                .slice(0, 3)
                .map((m) => `${m.name} (${(m.similarity * 100).toFixed(0)}%)`)
                .join("; ")}${more} — human review required (${provenance})`;
        return {
          content: [{ type: "text", text }],
          structuredContent: rec,
        };
      },
    },
  ];
}
