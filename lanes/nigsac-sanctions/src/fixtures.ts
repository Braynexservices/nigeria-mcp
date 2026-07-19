/**
 * Mock sanctions fixtures — a SYNTHETIC list so the lane and its own tests run with
 * zero signup. These are NOT real NIGSAC designations and the names are deliberately
 * fake ("TEST" / "ACME") — never real people. ADAEZE OKONKWO (the cross-lane cast) is
 * intentionally NOT listed: she is the canonical CLEAR screen.
 *
 * Canonical expectations:
 *   screen "IBRAHIM TEST DOE"  -> POTENTIAL_MATCH, similarity 1
 *   screen "ADAEZE OKONKWO"    -> CLEAR, 0 matches
 */
export interface FixtureListEntry {
  name: string;
  listType: string;
}

export const SANCTIONED: FixtureListEntry[] = [
  { name: "IBRAHIM TEST DOE", listType: "NIGSAC UNSC" },
  { name: "ACME SHELL CORP LTD", listType: "NIGSAC domestic" },
];

export const FIXTURE_LIST_VERSION = "mock-fixtures-2026-07";
