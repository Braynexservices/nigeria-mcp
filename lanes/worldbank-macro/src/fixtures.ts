/**
 * Mock macro fixtures — deterministic series so the lane and its own tests run with
 * zero network. Values mirror the real World Bank Nigeria series (probed 2026-07-15) so
 * demos read plausibly, but the canonical record is the live API, not this file.
 *
 * Canonical fixture: "gdp" (NY.GDP.MKTP.CD) MUST keep a positive 2023 point — the smoke
 * test pins it.
 */
export interface FixtureSeries {
  indicator: string;
  label: string;
  unit: string | null;
  points: { year: number; value: number | null }[];
}

export const SERIES: FixtureSeries[] = [
  {
    indicator: "NY.GDP.MKTP.CD",
    label: "GDP (current US$)",
    unit: null,
    points: [
      { year: 2020, value: 598586817817.39 },
      { year: 2021, value: 609147716965.35 },
      { year: 2022, value: 646950257575.46 },
      { year: 2023, value: 487387801877.8 },
    ],
  },
  {
    indicator: "NY.GDP.MKTP.KD.ZG",
    label: "GDP growth (annual %)",
    unit: null,
    points: [
      { year: 2020, value: -1.79 },
      { year: 2021, value: 3.65 },
      { year: 2022, value: 3.25 },
      { year: 2023, value: 2.86 },
    ],
  },
  {
    indicator: "FP.CPI.TOTL.ZG",
    label: "Inflation, consumer prices (annual %)",
    unit: null,
    points: [
      { year: 2021, value: 16.95 },
      { year: 2022, value: 18.85 },
      { year: 2023, value: 24.66 },
    ],
  },
];
