/**
 * Sanctions lane LIVE check — fetches + parses the official NIGSAC list page and runs a
 * screen against it. Failures print but exit 0 with an INCOMPLETE note (the portal may
 * be down; mock smoke is the gate).
 */
import { NigsacSanctionsProvider } from "../src/providers/nigsac.js";

const provider = new NigsacSanctionsProvider();
let ok = true;

try {
  const clear = await provider.screen("Acceptance Test Person");
  console.log(`screen("Acceptance Test Person") -> ${clear.status} (list ${clear.listVersion})`);
} catch (err) {
  ok = false;
  console.log(`screen FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(
  ok
    ? "\nNIGSAC-SANCTIONS LIVE CHECK OK"
    : "\nNIGSAC-SANCTIONS LIVE CHECK INCOMPLETE — set NIGSAC_LIST_URL to the current list page or a hosted JSON list.",
);
process.exit(0);
