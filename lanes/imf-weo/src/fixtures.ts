/**
 * Mock IMF WEO fixtures — deterministic series so the lane and its own tests run with
 * zero signup and no network. NOT live IMF figures; values are synthetic-but-plausible.
 * Canonical anchor: NGDP_RPCH (gdp_growth) year 2025 = 3.2 — the smoke test pins it.
 */
export interface FixtureSeries {
  code: string;
  label: string;
  points: { year: number; value: number | null }[];
}

export const SERIES: FixtureSeries[] = [
  {
    code: "NGDP_RPCH",
    label: "Real GDP growth (annual % change)",
    points: [
      { year: 2022, value: 3.3 },
      { year: 2023, value: 2.9 },
      { year: 2024, value: 3.4 },
      { year: 2025, value: 3.2 },
      { year: 2026, value: 3.0 },
    ],
  },
  {
    code: "PCPIPCH",
    label: "Inflation, average consumer prices (annual % change)",
    points: [
      { year: 2023, value: 24.7 },
      { year: 2024, value: 33.2 },
      { year: 2025, value: 23.0 },
      { year: 2026, value: 16.0 },
    ],
  },
];
