/**
 * Mock SDG fixtures — deterministic data so the lane and its own tests run with zero
 * signup. Values are canonical MOCK numbers (stable test anchors), not live UN figures:
 * the canonical anchor is extreme_poverty (SI_POV_DAY1) year 2020 = 30.9.
 */
export interface FixtureSdgSeries {
  seriesCode: string;
  description: string;
  goal: string | null;
  points: Array<{ year: number; value: number | null }>;
}

export const SERIES: FixtureSdgSeries[] = [
  {
    seriesCode: "SI_POV_DAY1",
    description: "Proportion of population below international poverty line (%)",
    goal: "1",
    points: [
      { year: 2010, value: 38.5 },
      { year: 2015, value: 35.8 },
      { year: 2018, value: 34.2 },
      { year: 2020, value: 30.9 },
    ],
  },
  {
    seriesCode: "EG_ACS_ELEC",
    description: "Proportion of population with access to electricity, by urban/rural (%)",
    goal: "7",
    points: [
      { year: 2010, value: 48.0 },
      { year: 2018, value: 56.5 },
      { year: 2021, value: 59.5 },
    ],
  },
];
