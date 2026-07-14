/**
 * Shared, free HS-classification heuristic used by both the mock and live (opendata)
 * providers. Whole-word keyword match against the fixture table — deterministic, no
 * external dependency. A commercial classifier (Avalara/Zonos) is the paid upgrade.
 */
import { HS_CODES } from "./fixtures.js";

/** Classify a product description to an HS code by whole-word keyword match. */
export function classifyHsLocal(productDescription: string): { hsCode: string; heading: string } | null {
  const words = productDescription.trim().toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  // Match whole words, but also their singular stem so a plural query ("cars", "cell phones",
  // "motor cars") still resolves to the keyword ("car", "phone") without loose substring matches.
  const stems = new Set(words.flatMap((w) => (w.length > 3 && w.endsWith("s") ? [w, w.slice(0, -1)] : [w])));
  const match = HS_CODES.find((h) => stems.has(h.keyword));
  return match ? { hsCode: match.hsCode, heading: match.heading } : null;
}

/** Best-effort commodity label for an HS code (from the same fixture); falls back to the code. */
export function hsLabel(code: string): string {
  return HS_CODES.find((h) => h.hsCode === code)?.heading ?? `HS ${code}`;
}
