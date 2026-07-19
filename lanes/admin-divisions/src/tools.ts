/**
 * Admin-divisions MCP tools. Provider-agnostic — each calls the injected
 * AdminDivisionsProvider and returns the normalized schema as structuredContent.
 * Public reference data only (no PII); the lane runs fully offline.
 */
import { z } from "zod";
import { stamp, type ToolDef } from "@braynexservices/nigeria-mcp-core";
import { type AdminDivisionsProvider, NormalizedLgas } from "./schema.js";

export function adminDivisionsTools(provider: AdminDivisionsProvider): ToolDef[] {
  return [
    {
      name: "list_states",
      title: "List Nigerian states",
      description:
        "List Nigeria's 36 states plus the FCT with the number of Local Government Areas in each. " +
        "Served from bundled reference data (fully offline). Use get_lgas for a state's LGA names.",
      inputSchema: {},
      outputSchema: {
        states: z.array(z.object({ state: z.string(), lgaCount: z.number() })),
        count: z.number().describe("Number of states returned (37 = 36 states + FCT)"),
        source: z.string(),
        retrievedAt: z.string(),
      },
      annotations: { openWorldHint: false },
      handler: async () => {
        const states = await provider.listStates();
        const payload = stamp(
          {
            states: states.map(({ state, lgaCount }) => ({ state, lgaCount })),
            count: states.length,
          },
          provider.name,
        );
        const text = states.map((s) => `${s.state} (${s.lgaCount} LGAs)`).join("\n");
        return { content: [{ type: "text", text }], structuredContent: payload };
      },
    },
    {
      name: "get_lgas",
      title: "Get a state's LGAs",
      description:
        "List the Local Government Areas of a Nigerian state. State matching is case-insensitive; " +
        "use 'FCT' (or 'Abuja') for the Federal Capital Territory. Served from bundled reference " +
        "data (fully offline). See list_states for valid state names.",
      inputSchema: {
        state: z.string().min(2).describe("State name, e.g. 'Lagos' or 'FCT' (case-insensitive)"),
      },
      outputSchema: NormalizedLgas.shape,
      annotations: { openWorldHint: false },
      handler: async (args) => {
        const rec = await provider.getLgas(String(args.state));
        return {
          content: [
            { type: "text", text: `${rec.state} — ${rec.lgas.length} LGAs: ${rec.lgas.join(", ")}` },
          ],
          structuredContent: rec,
        };
      },
    },
  ];
}
