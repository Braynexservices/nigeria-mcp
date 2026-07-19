/**
 * IMF WEO lane LIVE check — real keyless DataMapper call for gdp_growth (NGDP_RPCH).
 * Shape drift prints FAILED lines but exits 0 with an INCOMPLETE note (mock smoke is
 * the gate).
 */
import { ImfWeoProvider } from "../src/providers/imf.js";

const provider = new ImfWeoProvider();
let ok = true;

try {
  const series = await provider.getIndicator("NGDP_RPCH", 2020, 2028);
  const latest = [...series.points].reverse().find((p) => p.value !== null);
  console.log(
    `get_imf_projection(NGDP_RPCH) -> ${series.points.length} points, latest ${latest?.year}: ${latest?.value} (projections: ${series.includesProjections})`,
  );
  if (series.points.length === 0) ok = false;
} catch (err) {
  ok = false;
  console.log(`get_imf_projection FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(ok ? "\nIMF-WEO LIVE CHECK OK" : "\nIMF-WEO LIVE CHECK INCOMPLETE — see failures above.");
process.exit(0);
