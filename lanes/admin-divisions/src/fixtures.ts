/**
 * Dataset invariants used by the smoke assertions. Not mock data — the static provider
 * IS the offline default; these are the facts the bundled dataset must always satisfy.
 */
export const EXPECTED_STATE_COUNT = 37; // 36 states + FCT
export const EXPECTED_TOTAL_LGAS = 774;
export const SAMPLE_STATE = "Lagos";
export const SAMPLE_LGA = "Eti-Osa"; // must appear in Lagos
