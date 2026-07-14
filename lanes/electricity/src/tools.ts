/**
 * Electricity MCP tools. Provider-agnostic — each calls the injected MeterProvider and
 * returns the normalized schema as structuredContent. READ-ONLY: validation/info only,
 * never payments. Customer PII is pass-through (not stored).
 */
import { z } from "zod";
import { type ToolDef, type MeterProvider, NormalizedMeter } from "@braynexservices/nigeria-mcp-core";

export function electricityTools(provider: MeterProvider): ToolDef[] {
  return [
    {
      name: "validate_meter",
      title: "Validate Nigerian electricity meter",
      description:
        "Validate an electricity meter (read-only) and return the registered customer name/address and DisCo. " +
        "Provide the meter number, DisCo code (see list_discos) and meter type. Does NOT buy power or pay bills. " +
        "Example: { meter_number: '45010101010', disco: 'EKEDC', meter_type: 'prepaid' }.",
      inputSchema: {
        meter_number: z.string().min(4).describe("Electricity meter number"),
        disco: z.string().min(2).describe("Distribution company code, e.g. EKEDC (see list_discos)"),
        meter_type: z.enum(["prepaid", "postpaid"]).describe("Meter type"),
      },
      outputSchema: NormalizedMeter.shape,
      handler: async (args) => {
        const meter = await provider.validate(
          String(args.meter_number),
          String(args.disco),
          String(args.meter_type),
        );
        const who = meter.customerName ?? "(name unavailable)";
        return {
          content: [
            { type: "text", text: `${who} — meter ${meter.meterNumber} (${meter.meterType}) on ${meter.disco}` },
          ],
          structuredContent: meter,
        };
      },
    },
    {
      name: "list_discos",
      title: "List Nigerian electricity DisCos",
      description:
        "List supported Nigerian electricity distribution companies (DisCos) with their codes. " +
        "Use a returned code as the disco for validate_meter.",
      inputSchema: {},
      outputSchema: { discos: z.array(z.object({ code: z.string(), name: z.string() })) },
      handler: async () => {
        const discos = await provider.listDiscos();
        const text = discos.length
          ? discos.map((d) => `${d.code} — ${d.name}`).join("\n")
          : "No DisCos available.";
        return { content: [{ type: "text", text }], structuredContent: { discos } };
      },
    },
  ];
}
