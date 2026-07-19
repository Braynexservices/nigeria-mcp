/**
 * Macro lane LIVE check against the World Bank Indicators API v2 — FREE and KEYLESS, so
 * no env needed. Confirms the [meta, rows] envelope still matches what the adapter was
 * built against (verified 2026-07-15): gdp (NY.GDP.MKTP.CD) for NGA, 2020-2023.
 *
 * Shape surprises are reported as FAILED lines + an INCOMPLETE note, but exit 0 — the
 * smoke gate is the mock run; this is a canary, not a gate.
 */
import { WorldBankMacroProvider } from "../src/providers/worldbank.js";

const provider = new WorldBankMacroProvider();

let ok = true;
try {
  const series = await provider.getIndicator("NY.GDP.MKTP.CD", 2020, 2023);
  console.log(`get_macro_indicator(gdp, 2020-2023) -> ${series.label} | ${series.points.length} points`);
  for (const p of series.points) console.log(`  ${p.year}: ${p.value}`);

  if (series.indicator !== "NY.GDP.MKTP.CD") {
    ok = false;
    console.log(`indicator FAILED -> expected NY.GDP.MKTP.CD, got ${series.indicator}`);
  }
  if (series.country !== "NGA") {
    ok = false;
    console.log(`country FAILED -> expected NGA, got ${series.country}`);
  }
  if (series.points.length !== 4) {
    ok = false;
    console.log(`points FAILED -> expected 4 points for 2020:2023, got ${series.points.length}`);
  }
  const p2023 = series.points.find((p) => p.year === 2023);
  if (!p2023 || typeof p2023.value !== "number" || p2023.value <= 0) {
    ok = false;
    console.log(`2023 point FAILED -> ${JSON.stringify(p2023 ?? null)} (expected a positive number)`);
  }
  const sorted = series.points.every((p, i, a) => i === 0 || a[i - 1].year < p.year);
  if (!sorted) {
    ok = false;
    console.log("ordering FAILED -> points are not ascending by year");
  }
} catch (err) {
  ok = false;
  console.log(`get_macro_indicator FAILED -> ${err instanceof Error ? err.message : err}`);
}

console.log(
  ok
    ? "\nWORLDBANK-MACRO (World Bank) LIVE CHECK OK"
    : "\nWORLDBANK-MACRO LIVE CHECK INCOMPLETE — see failures above (API envelope may have shifted; the mock smoke gate still stands).",
);
process.exit(0); // keyless public API; the smoke gate is the mock run
