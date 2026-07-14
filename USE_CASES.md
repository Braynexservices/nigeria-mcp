# Use Cases: Nigeria MCP

Practical applications for each server. These MCPs give an AI assistant (Claude and others) or any app reliable, normalized access to Nigerian data through a few simple tools. Every lane ships **mock-first** (runs offline, zero signup) and has a live provider you switch on with one env var.

**Status:** 4 live servers — Bank Resolve, Electricity Meter, FX Rates, Trade Intel.

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

