/**
 * Health-facility lane LIVE check — real keyless GRID3 query around Lagos. Shape drift
 * prints FAILED lines but exits 0 with an INCOMPLETE note (the mock smoke is the gate).
 */
import { Grid3HealthFacilityProvider } from "../src/providers/grid3.js";

const provider = new Grid3HealthFacilityProvider();
let ok = true;

try {
  const facilities = await provider.findNear(6.45, 3.4, 10, 5);
  console.log(`find_facilities_near(6.45, 3.40, 10km) -> ${facilities.length} facility(ies)`);
  for (const f of facilities.slice(0, 3)) {
    console.log(`  ${f.name} (${f.category ?? "?"}) ${f.distanceKm ?? "?"} km`);
  }
  if (facilities.length === 0) {
    ok = false;
    console.log("  (0 results around central Lagos is suspicious for a 51k-facility dataset)");
  }
} catch (err) {
  ok = false;
  console.log(`find_facilities_near FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(ok ? "\nHEALTH-FACILITY LIVE CHECK OK" : "\nHEALTH-FACILITY LIVE CHECK INCOMPLETE — service URL is env-overridable (GRID3_HEALTH_URL).");
process.exit(0);
