/**
 * UN SDG lane LIVE check — real keyless call for extreme_poverty (SI_POV_DAY1).
 * Shape drift prints FAILED lines but exits 0 with an INCOMPLETE note (mock smoke is
 * the gate).
 */
import { UnSdgProvider } from "../src/providers/unsdg.js";

const provider = new UnSdgProvider();
let ok = true;

try {
  const series = await provider.getSeries("SI_POV_DAY1");
  const valued = series.points.filter((p) => p.value !== null);
  const latest = valued[valued.length - 1];
  console.log(`get_sdg_indicator(SI_POV_DAY1) -> ${series.points.length} points, latest ${latest?.year}: ${latest?.value}`);
  if (series.points.length === 0) ok = false;
} catch (err) {
  ok = false;
  console.log(`get_sdg_indicator FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(ok ? "\nUN-SDG LIVE CHECK OK" : "\nUN-SDG LIVE CHECK INCOMPLETE — base URL env-overridable (UN_SDG_BASE_URL).");
process.exit(0);
