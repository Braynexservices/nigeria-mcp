/**
 * Mock sanctions provider — an explicit opt-in offline stub (SANCTIONS_PROVIDER=mock), NOT the
 * default (the default is the live "nigsac" register; a synthetic list must never be the default
 * or it would silently CLEAR real names). Screens against the SYNTHETIC fixture list so the lane
 * runs with zero signup for dev/eval.
 *
 * Screening never throws not-found: an unmatched name is a CLEAR result.
 */
import { stamp } from "@braynexservices/nigeria-mcp-core";
import { type SanctionsProvider, type NormalizedSanctionsScreen } from "../schema.js";
import { screenList } from "../match.js";
import { FIXTURE_LIST_VERSION, SANCTIONED } from "../fixtures.js";

export class MockSanctionsProvider implements SanctionsProvider {
  readonly name = "mock";

  async screen(name: string): Promise<NormalizedSanctionsScreen> {
    const { status, matches } = screenList(name, SANCTIONED);
    return stamp(
      {
        query: name,
        status,
        matches,
        listVersion: FIXTURE_LIST_VERSION,
      },
      this.name,
    );
  }
}
