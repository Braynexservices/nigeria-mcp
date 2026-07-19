/**
 * Lane-local name-matching logic, shared by every provider so mock and live screens
 * behave identically (fetching the list is the provider's job; scoring it is not).
 *
 * Design goal: a sanctions screen must OVER-flag, never silently under-flag. A false
 * POTENTIAL_MATCH costs a human a moment's review; a false CLEAR misses a real designation.
 * So the scorer is deliberately recall-leaning:
 *   - normalize with Unicode diacritic FOLDING ("Bàbátúndé" -> "BABATUNDE"), so accented and
 *     un-accented spellings of the same West African name still match (folding, not shredding).
 *   - score by CONTAINMENT of the shorter name in the longer (shared / min tokens), so a query
 *     that is a subset of a longer listed designation ("Muhammad Ibrahim" vs "MUHAMMAD AWWAL
 *     IBRAHIM ADAM SULEIMAN") still scores high instead of being diluted by the extra tokens.
 *   - match tokens FUZZILY (bounded edit distance), so transliteration variants
 *     ("Mohammed" ~ "Muhammad") count as the same name part.
 * An unmatched name yields CLEAR — screening never throws not-found.
 */
import { type SanctionsMatch } from "./schema.js";

export const MATCH_THRESHOLD = 0.5;
/** Two name-tokens count as "the same" at or above this edit-distance similarity. */
export const TOKEN_MATCH_THRESHOLD = 0.75;
/** Cap the candidate list so a very common token can't flood the result. */
export const MAX_MATCHES = 25;

export interface ListEntry {
  name: string;
  listType: string | null;
}

/**
 * Uppercase, FOLD diacritics to their base letter, replace punctuation with spaces, collapse
 * whitespace. Folding (NFKD then strip combining marks) BEFORE the A-Z filter is essential:
 * stripping accents naively via [^A-Z0-9] would turn "é" into a word break, shredding the name.
 */
export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/** Levenshtein edit distance (iterative, two-row). Cheap for name-length tokens. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

/** Token-level similarity in [0,1]: 1 - editDistance/maxLen. */
function tokenSim(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

/**
 * Similarity in [0,1]: 1 for an exact normalized match, else fuzzy containment — the fraction
 * of the SHORTER name's tokens that have a close match (>= TOKEN_MATCH_THRESHOLD) in the longer.
 */
export function similarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = [...new Set(na.split(" "))].filter(Boolean);
  const tb = [...new Set(nb.split(" "))].filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return 0;
  const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  let matched = 0;
  for (const token of small) {
    let best = 0;
    for (const other of large) {
      const s = tokenSim(token, other);
      if (s > best) best = s;
      if (best === 1) break;
    }
    if (best >= TOKEN_MATCH_THRESHOLD) matched++;
  }
  const score = matched / small.length;
  return Math.round(score * 10_000) / 10_000;
}

/** Screen a query against a list; returns candidates >= threshold, highest first (capped). */
export function screenList(
  query: string,
  entries: ListEntry[],
): { status: "CLEAR" | "POTENTIAL_MATCH"; matches: SanctionsMatch[] } {
  const matches: SanctionsMatch[] = [];
  for (const entry of entries) {
    const score = similarity(query, entry.name);
    if (score >= MATCH_THRESHOLD) {
      matches.push({ name: entry.name, listType: entry.listType, similarity: score });
    }
  }
  matches.sort((a, b) => b.similarity - a.similarity);
  return {
    status: matches.length > 0 ? "POTENTIAL_MATCH" : "CLEAR",
    matches: matches.slice(0, MAX_MATCHES),
  };
}
