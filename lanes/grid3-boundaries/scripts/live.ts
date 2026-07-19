/**
 * Boundaries lane LIVE check — real keyless GRID3 ArcGIS calls (get_boundary Lagos +
 * point_in_admin 6.43,3.42). Shape drift prints FAILED lines but exits 0 with an
 * INCOMPLETE note (the mock smoke is the gate).
 */
import { Grid3BoundaryProvider } from "../src/providers/grid3.js";

const provider = new Grid3BoundaryProvider();
let ok = true;

try {
  const lagos = await provider.getBoundary("state", "Lagos");
  console.log(`get_boundary(state, Lagos) -> centroid ${lagos.centroid.lat.toFixed(4)}, ${lagos.centroid.lng.toFixed(4)} | bbox ${lagos.bbox.map((n) => n.toFixed(2)).join(",")}`);
} catch (err) {
  ok = false;
  console.log(`get_boundary FAILED -> ${err instanceof Error ? err.message : err}`);
}
try {
  const pt = await provider.pointInAdmin(6.43, 3.42);
  console.log(`point_in_admin(6.43, 3.42) -> ${pt.state} / ${pt.lga} / ${pt.ward ?? "-"}`);
} catch (err) {
  ok = false;
  console.log(`point_in_admin FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(ok ? "\nGRID3-BOUNDARIES LIVE CHECK OK" : "\nGRID3-BOUNDARIES LIVE CHECK INCOMPLETE — service URLs are env-overridable (GRID3_STATE_URL / GRID3_LGA_URL / GRID3_WARD_URL).");
process.exit(0);
