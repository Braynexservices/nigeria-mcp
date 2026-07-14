/**
 * Mock meter provider — the default. Validates meters against deterministic fixtures so the
 * lane runs with zero signup. Implements the core MeterProvider interface; swap via
 * ELECTRICITY_PROVIDER env. READ-ONLY: no payment methods.
 *
 * NDPA: customer name/address are PII — pass-through only, never cached/persisted.
 */
import {
  type MeterProvider,
  type Disco,
  type NormalizedMeter,
  stamp,
  notFound,
} from "@braynexservices/nigeria-mcp-core";
import { DISCOS, METERS } from "../fixtures.js";

export class MockMeterProvider implements MeterProvider {
  readonly name = "mock";

  async validate(meterNumber: string, disco: string, meterType: string): Promise<NormalizedMeter> {
    const mn = meterNumber.trim();
    const d = disco.trim().toUpperCase();
    const mt = meterType.trim().toLowerCase();

    const meter = METERS.find((m) => m.meterNumber === mn && m.disco === d);
    if (!meter) {
      notFound(
        `Meter ${meterNumber} on ${disco}`,
        "Check the meter number and DisCo code (call list_discos for valid codes).",
      );
    }
    // Honest validation: the on-file meter type must match the requested type.
    if (meter.meterType !== mt) {
      notFound(
        `Meter ${meterNumber} as ${meterType}`,
        `This meter is registered as ${meter.meterType} on ${meter.disco}, not ${meterType}.`,
      );
    }
    return stamp(
      {
        meterNumber: meter.meterNumber,
        customerName: meter.customerName ?? null,
        address: meter.address ?? null,
        disco: meter.disco,
        meterType: meter.meterType,
      },
      this.name,
    );
  }

  async listDiscos(): Promise<Disco[]> {
    return DISCOS.map((d) => ({ code: d.code, name: d.name }));
  }
}
