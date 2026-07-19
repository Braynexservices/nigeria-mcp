# Use Cases: Nigeria MCP

Practical applications for each server. These MCPs give an AI assistant (Claude and others) or any app reliable, normalized access to Nigerian data through a few simple tools. Every lane ships **mock-first** (runs offline, zero signup) and has a live provider you switch on with one env var.

**Status:** 12 live servers — Bank Resolve, Electricity Meter, FX Rates, Trade Intel, Admin Boundaries, Admin Divisions, Health Facilities, World Bank Macro, IMF WEO, UN SDG, Crypto Tickers, Sanctions Screening. The eight newest are **keyless** (Admin Divisions runs fully offline).

> Draft: practical examples per lane. We refine these with real customer scenarios as adoption grows.

---

## Nigeria Bank Resolve
**Tools:** `resolve_bank_account`, `list_banks` · **Live via:** Paystack (free)

Confirm that a NUBAN plus bank code really belongs to the name you expect, before you trust or transact.

- **Payee verification before a transfer.** "Confirm 0123456789 at GTBank resolves to ADAEZE OKONKWO before I send." Cuts wrong-account and fraud losses, a leading cause of disputed Nigerian transfers.
- **KYC and onboarding.** Verify a user's bank account belongs to them at signup by matching the resolved name.
- **Vendor and invoice checks.** Confirm a supplier's account name matches their business before paying an invoice.
- **Agent workflows.** A finance assistant resolves the account name inline while drafting a payment, so the person sees exactly who they are paying.

*Read-only: it returns the registered account name and the bank list. It does not move money.*

---

## Nigeria Electricity Meter
**Tools:** `validate_meter`, `list_discos` · **Live via:** VTpass (free)

Validate a prepaid or postpaid meter and get the registered customer name, address, and DisCo before any top-up or service action.

- **Confirm the right meter before a top-up or bill-pay.** Avoid crediting the wrong meter, which is effectively irreversible once vended.
- **Address and KYC signal.** Use the meter's registered address as a proof-of-address input during onboarding.
- **Support and field agents.** Quickly confirm a customer's DisCo and account details from the meter number.
- **Agent workflows.** "Whose meter is 45010101010 on EKEDC?" answered inline before a payment step.

*Read-only: validation and info only, never payments.*

---

## Nigeria FX Rates
**Tools:** `get_fx_rates` · **Live via:** open.er-api.com (free, keyless)

Live Naira exchange rates against USD, EUR, and GBP.

- **Show live NGN rates in an app or dashboard** without paying for an FX API.
- **Multi-currency pricing.** Price goods in USD or EUR and display the Naira equivalent.
- **Remittance and quoting.** Estimate a transfer's Naira value on the fly.
- **Accounting and expense conversion.** Convert foreign spend to NGN for the books.
- **Agent workflows.** "What is the dollar to naira rate today?" answered with a real, dated rate instead of a guess.

*Official / interbank window. The parallel ("aboki") market is not covered here.*

---

## Nigeria Trade Intel
**Tools:** `get_trade_stats`, `classify_hs` · **Live via:** UN Comtrade (free, keyless)

Nigeria import and export statistics plus HS-code classification.

- **Market and sourcing research.** "Who does Nigeria import machinery from, and how much?" Ranks partners and commodities by value.
- **Procurement and import planning.** Pull volumes, CIF/FOB values, and weights for a commodity and partner.
- **Customs and shipping prep.** Classify a product to its HS code ("motor cars" gives 8703) for duties and paperwork.
- **Journalism, policy, and economics.** Cite authoritative trade figures with source and period.
- **Agent workflows.** An analyst assistant answers trade questions with real Comtrade data, not guesses.

*Public macro data, no PII. Annual data lags roughly 1 to 2 years.*

---

## Nigeria Admin Boundaries
**Tools:** `get_boundary`, `point_in_admin` · **Live via:** GRID3 ArcGIS (CC BY 4.0, keyless)

Turn a state / LGA / ward name into geometry, or turn a coordinate into the admin unit that contains it.

- **Reverse-geocode a coordinate.** "Which LGA is 6.5244, 3.3792 in?" `point_in_admin` returns the containing state/LGA/ward — useful for routing a lead, ticket, or delivery to the right local area.
- **Map centering and framing.** Use a boundary's centroid and bounding box to center or zoom a map to any state or LGA.
- **Bucket records by admin unit.** Tag addresses or GPS pings with their LGA for regional reporting and coverage analysis.
- **Agent workflows.** "What LGA is this branch in, and give me a box to draw around it" answered inline before a mapping step.

*Public geospatial data, no PII.*

---

## Nigeria Admin Divisions
**Tools:** `list_states`, `get_lgas` · **Runs:** fully offline (bundled dataset, MIT, no key)

The canonical list of Nigeria's 36 states + FCT and all 774 LGAs — with **zero network calls**.

- **Populate dropdowns and forms.** Feed a signup or checkout form the exact state → LGA cascade without maintaining your own list.
- **Validate location input.** Confirm a submitted state/LGA is real before saving it.
- **Offline / air-gapped reference.** Works with no internet and no key, so it is safe inside restricted environments and cheap to call in a loop.
- **Agent workflows.** "List the LGAs in Kano State" answered instantly, no API round-trip.

*Static reference data, no PII, no network.*

---

## Nigeria Health Facilities
**Tools:** `find_facilities_near`, `get_facility` · **Live via:** GRID3 NGA Health Facilities v2.0 (CC BY 4.0, keyless)

Find health facilities near a coordinate, sorted by distance.

- **Nearest-clinic lookup.** "Find the closest health facilities to 9.0579, 7.4951" for a triage, referral, or field-response assistant.
- **Reverse-geocode + nearest care.** Pair with Admin Boundaries: resolve a point to its LGA, then list the nearest clinics in one flow.
- **Coverage and access analysis.** Count facilities within range of a community to spot underserved areas.
- **Agent workflows.** A health assistant answers "where's the nearest facility?" with real, located results instead of a guess.

*Public geospatial data, no PII.*

---

## Nigeria World Bank Macro
**Tools:** `get_macro_indicator` · **Live via:** World Bank Indicators API (keyless)

Nigerian macro indicators — GDP, inflation, population, remittances, FDI, unemployment.

- **Macro dashboard.** Pull a time series for any indicator to chart Nigeria's economy without wiring up the World Bank API yourself.
- **Context for a report or memo.** Cite GDP, inflation, or remittance figures with a source and period.
- **Screening and modelling inputs.** Feed macro series into a risk, pricing, or forecasting model.
- **Agent workflows.** "What was Nigeria's inflation last year?" answered with a real, dated World Bank figure.

*Public macro data, no PII.*

---

## Nigeria IMF WEO
**Tools:** `get_imf_projection` · **Live via:** IMF DataMapper API (keyless)

IMF World Economic Outlook for Nigeria — growth, inflation, debt, current account, unemployment, including forward projections.

- **Forward-looking view.** Show the IMF's projected growth or inflation path, not just historicals.
- **Cross-check macro sources.** Compare IMF WEO against World Bank figures for the same indicator.
- **Briefings and investment notes.** Cite IMF projections with source and vintage.
- **Agent workflows.** "What does the IMF project for Nigeria's GDP growth?" answered with real DataMapper values.

*Public macro data, no PII.*

---

## Nigeria UN SDG
**Tools:** `get_sdg_indicator` · **Live via:** UN SDG Global Database (keyless)

Nigeria's UN Sustainable Development Goal indicators — poverty, under-5 mortality, electricity & water access, primary completion.

- **Development and impact reporting.** Pull official SDG figures for grant reports, ESG write-ups, or research.
- **Access and equity analysis.** Track electricity or water access alongside the geospatial lanes for a fuller picture.
- **Sourced social stats.** Cite an SDG indicator with its period instead of estimating.
- **Agent workflows.** "What's Nigeria's under-5 mortality rate?" answered from the UN SDG database.

*Public development data, no PII.*

---

## Nigeria Crypto Tickers
**Tools:** `get_crypto_ticker`, `list_crypto_markets` · **Live via:** Quidax (keyless)

Live crypto prices quoted in Naira, read-only.

- **Show BTC/NGN and other pairs** in an app or dashboard without a paid market-data feed.
- **Naira conversion for crypto amounts.** Estimate the NGN value of a holding on the fly.
- **Market discovery.** `list_crypto_markets` enumerates the tradable pairs available.
- **Agent workflows.** "What's Bitcoin in Naira right now?" answered with a real, dated ticker.

*Read-only market data. No trading, no keys, no PII.*

---

## Nigeria Sanctions Screening
**Tools:** `screen_sanctions` · **Live via:** NIGSAC register (keyless)

Screen a name against Nigeria's official NIGSAC sanctions register and get a match signal for a human to review.

- **KYC pre-screen.** During onboarding, run a name against the NIGSAC list to flag possible matches for a compliance officer to examine.
- **Vendor and counterparty checks.** Surface a possible-match signal before engaging a new partner.
- **Triage queue.** Batch-screen names and route only the flagged ones to a reviewer.
- **Agent workflows.** "Does this name appear on the NIGSAC register?" returns a best-effort signal, always handed to a person for the decision.

> **Read the caveat.** This is a **best-effort fuzzy screening signal for human review — NOT a legal or compliance-grade determination.** It checks the **Nigerian NIGSAC list only** (no international or other national lists). A hit is not proof of a sanctioned party, and a miss is not clearance. Always confirm with a qualified human and your full compliance process.

---

