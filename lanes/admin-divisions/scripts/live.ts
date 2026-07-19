/**
 * Admin-divisions lane LIVE check. The lane is fully offline — the bundled static
 * dataset IS the live source — so this simply runs the real provider and prints counts.
 */
import { StaticAdminDivisionsProvider } from "../src/providers/static.js";

const provider = new StaticAdminDivisionsProvider();
const states = await provider.listStates();
const totalLgas = states.reduce((n, s) => n + s.lgaCount, 0);
console.log(`states: ${states.length} (36 + FCT) | total LGAs: ${totalLgas}`);

const lagos = await provider.getLgas("Lagos");
console.log(`Lagos: ${lagos.lgas.length} LGAs — ${lagos.lgas.join(", ")}`);

console.log("\nADMIN-DIVISIONS (static) LIVE CHECK OK");
process.exit(0);
