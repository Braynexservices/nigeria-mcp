/**
 * Normalization helpers. Lane adapters map raw provider payloads into the schemas in
 * schemas.ts and stamp provenance via these helpers.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Stamp source + retrievedAt onto a normalized record. */
export function stamp<T extends object>(
  record: T,
  source: string,
): T & { source: string; retrievedAt: string } {
  return { ...record, source, retrievedAt: nowIso() };
}
