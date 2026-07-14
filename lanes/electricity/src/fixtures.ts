/**
 * Mock electricity fixtures — deterministic meter + DisCo data so the lane (and eval) work
 * with zero signup. NOT real customer records. Customer name/address are synthetic and
 * reuse the cross-lane cast for demos. READ-ONLY lane: validation/info only, no payments.
 */
export interface FixtureDisco {
  code: string;
  name: string;
}

export interface FixtureMeter {
  meterNumber: string;
  disco: string; // DisCo code
  meterType: "prepaid" | "postpaid";
  customerName?: string;
  address?: string;
}

export const DISCOS: FixtureDisco[] = [
  { code: "EKEDC", name: "Eko Electricity Distribution Company" },
  { code: "IKEDC", name: "Ikeja Electric" },
  { code: "AEDC", name: "Abuja Electricity Distribution Company" },
  { code: "PHED", name: "Port Harcourt Electricity Distribution Company" },
  { code: "KAEDCO", name: "Kaduna Electricity Distribution Company" },
  { code: "EEDC", name: "Enugu Electricity Distribution Company" },
];

export const METERS: FixtureMeter[] = [
  { meterNumber: "45010101010", disco: "EKEDC", meterType: "prepaid", customerName: "ADAEZE OKONKWO", address: "14 Adeola Odeku Street, Victoria Island, Lagos" },
  { meterNumber: "62120202020", disco: "IKEDC", meterType: "postpaid", customerName: "TUNDE BAKARE", address: "5 Allen Avenue, Ikeja, Lagos" },
  { meterNumber: "33030303030", disco: "AEDC", meterType: "prepaid", customerName: "ZENITH DATA SYSTEMS LIMITED", address: "23 Aminu Kano Crescent, Wuse II, Abuja" },
  { meterNumber: "70040404040", disco: "PHED", meterType: "postpaid", customerName: "IBRAHIM SANI", address: "Plot 5, Trans-Amadi Industrial Layout, Port Harcourt" },
];
