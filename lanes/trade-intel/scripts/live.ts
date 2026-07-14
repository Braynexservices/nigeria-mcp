/**
 * LIVE check for the opendata (UN Comtrade) provider — hits the real keyless API.
 * Not part of the default offline smoke. Run: npm run smoke:live -w @braynexservices/nigeria-mcp-trade-intel
 * Exits non-zero on failure. Network required.
 */
import { OpenDataTradeProvider } from "../src/providers/opendata.js";

const p = new OpenDataTradeProvider();

const exportsAll = await p.tradeStats({ flow: "export" }); // all partners, TOTAL, default year
console.log(
  `exports(all): ${exportsAll.length} flows; top:`,
  exportsAll.slice(0, 3).map((f) => `${f.partner} $${Math.round(f.valueUsd / 1e6)}M`).join(", "),
);

const crudeToIndia = (await p.tradeStats({ flow: "export", partner: "India", commodity: "2709" }))[0];
console.log("export crude→India:", JSON.stringify(crudeToIndia ?? null));

// NEW: commodity breakdown by chapter (imports from China) — exercises AG2 + HS descriptions
const chapters = await p.tradeStats({ flow: "import", partner: "China", commodity: "chapters" });
console.log(
  `import China by chapter: ${chapters.length} chapters; top 3:`,
  chapters.slice(0, 3).map((f) => `HS${f.hsCode} ${f.commodity.slice(0, 24)} $${Math.round(f.valueUsd / 1e6)}M`).join(" | "),
);

// NEW: monthly frequency
const monthly = await p.tradeStats({ flow: "import", partner: "China", commodity: "85", frequency: "monthly", year: 2023, month: 12 });
console.log("monthly (China HS85, 2023-12):", JSON.stringify(monthly[0] ?? null));

const hs = await p.classifyHs("crude oil");
console.log("classify 'crude oil' ->", hs.hsCode);

const ok =
  exportsAll.length > 0 &&
  exportsAll.every((f) => f.reporter === "Nigeria" && f.source === "comtrade" && f.valueUsd > 0) &&
  // partner names resolved from the reference (not a raw "Comtrade <code>" fallback)
  exportsAll.every((f) => !/^Comtrade \d+$/.test(f.partner)) &&
  // breakdown returns multiple chapters, each with a real (non-code) description from the HS ref
  chapters.length > 1 &&
  chapters.some((f) => !/^HS \d+$/.test(f.commodity) && f.commodity !== "All commodities") &&
  // monthly query returns a 6-digit period
  (monthly.length === 0 || /^\d{6}$/.test(monthly[0].period)) &&
  hs.hsCode === "2709";

if (!ok) {
  console.error("TRADE LIVE CHECK FAIL");
  process.exit(1);
}
console.log("TRADE LIVE CHECK OK");
process.exit(0);
