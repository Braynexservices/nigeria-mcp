/**
 * Live VTpass meter-validation adapter. READ-ONLY — uses ONLY the address/merchant verify
 * endpoint; never pay/recharge (that would inherit NERC/CBN/AML obligations). Public macro
 * data is N/A here — customer name/address are PII, returned pass-through and NEVER cached.
 *
 * Verified endpoints (sandbox):
 *  - GET  /services?identifier=electricity-bill   (headers: api-key + public-key) -> DisCo list
 *  - POST /merchant-verify  (headers: api-key + secret-key; form: billersCode, serviceID, type)
 *      success -> content.Customer_Name/Address/Meter_Number; bad meter -> content.error
 * Keys: VTPASS_API_KEY / VTPASS_PUBLIC_KEY / VTPASS_SECRET_KEY (from the environment).
 */
import {
  type MeterProvider,
  type Disco,
  type NormalizedMeter,
  fetchJson,
  loadConfig,
  stamp,
  notFound,
  ToolError,
} from "@braynexservices/nigeria-mcp-core";

const TIMEOUT_MS = 20_000;

interface VtpassService {
  serviceID?: string;
  name?: string;
}
interface VtpassVerifyContent {
  Customer_Name?: string;
  Address?: string;
  Meter_Number?: string;
  Meter_Type?: string;
  error?: string;
}

export class VtpassMeterProvider implements MeterProvider {
  readonly name = "vtpass";
  // Reference data (DisCo list + lookups) is memoized once per process — restart to refresh.
  private serviceIndex?: Map<string, string>; // lc serviceID / abbreviation -> serviceID
  private serviceCode?: Map<string, string>; // serviceID -> DisCo code (e.g. "IKEDC")
  private discoList?: Disco[];

  constructor(
    private readonly cfg = loadConfig(),
  ) {}

  private requireKeys(): void {
    if (!this.cfg.vtpassApiKey || !this.cfg.vtpassPublicKey || !this.cfg.vtpassSecretKey) {
      throw new ToolError(
        "VTpass keys are not set (VTPASS_API_KEY / VTPASS_PUBLIC_KEY / VTPASS_SECRET_KEY).",
        "Set them in your MCP client's env block, or set ELECTRICITY_PROVIDER=mock.",
      );
    }
  }

  /** fetch + distinguish auth/transient failures (so a bad key isn't reported as "not found"). */
  private async vtFetch(url: string, init: RequestInit): Promise<unknown> {
    const { res, body } = await fetchJson(url, init, {
      service: "VTpass",
      fallbackHint: "set ELECTRICITY_PROVIDER=mock",
      timeoutMs: TIMEOUT_MS,
    });
    if (res.status === 401 || res.status === 403) {
      throw new ToolError(
        `VTpass rejected the credentials (HTTP ${res.status}).`,
        "Check VTPASS_API_KEY / VTPASS_PUBLIC_KEY / VTPASS_SECRET_KEY, or set ELECTRICITY_PROVIDER=mock.",
      );
    }
    return body; // VTpass returns its envelope on 200 + benign 4xx
  }

  /** Load + index the electricity DisCo list (memoized). Builds serviceID + abbreviation lookups. */
  private async loadServices(): Promise<{ list: Disco[]; index: Map<string, string> }> {
    if (this.discoList && this.serviceIndex) return { list: this.discoList, index: this.serviceIndex };
    this.requireKeys();
    const body = (await this.vtFetch(`${this.cfg.vtpassBaseUrl}/services?identifier=electricity-bill`, {
      headers: { "api-key": this.cfg.vtpassApiKey!, "public-key": this.cfg.vtpassPublicKey! },
    })) as { content?: VtpassService[] } | null;
    const items = body?.content;
    if (!Array.isArray(items) || items.length === 0) {
      throw new ToolError("VTpass returned no electricity services.", "Retry shortly, or set ELECTRICITY_PROVIDER=mock.");
    }
    const list: Disco[] = [];
    const index = new Map<string, string>();
    const codeByService = new Map<string, string>();
    for (const s of items) {
      if (!s.serviceID) continue;
      const name = s.name ?? s.serviceID;
      // names look like "Ikeja Electric Payment - IKEDC" — the trailing segment is the DisCo code
      const segments = name.split(" - ");
      const tail = segments[segments.length - 1]?.trim();
      // Expose the DisCo code (e.g. "IKEDC") as the list code so the shape matches the mock,
      // not the VTpass serviceID ("ikeja-electric"). Fall back to serviceID when there's no code.
      const code = segments.length > 1 && tail ? tail.toUpperCase() : s.serviceID;
      list.push({ code, name });
      index.set(s.serviceID.toLowerCase(), s.serviceID);
      if (tail) index.set(tail.toLowerCase(), s.serviceID); // accept the abbreviation too
      codeByService.set(s.serviceID, code);
    }
    this.discoList = list;
    this.serviceIndex = index;
    this.serviceCode = codeByService;
    return { list, index };
  }

  /** Accept a VTpass serviceID ("ikeja-electric") OR a DisCo abbreviation ("IKEDC"). */
  private async resolveServiceId(disco: string): Promise<string> {
    const { index } = await this.loadServices();
    const id = index.get(disco.trim().toLowerCase());
    if (!id) {
      notFound(`DisCo "${disco}"`, "Call list_discos for valid codes (e.g. 'ikeja-electric' or 'IKEDC').");
    }
    return id;
  }

  async validate(meterNumber: string, disco: string, meterType: string): Promise<NormalizedMeter> {
    this.requireKeys();
    const serviceID = await this.resolveServiceId(disco);
    const type = meterType.trim().toLowerCase();
    const form = new URLSearchParams({ billersCode: meterNumber.trim(), serviceID, type });
    const body = (await this.vtFetch(`${this.cfg.vtpassBaseUrl}/merchant-verify`, {
      method: "POST",
      headers: {
        "api-key": this.cfg.vtpassApiKey!,
        "secret-key": this.cfg.vtpassSecretKey!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    })) as { content?: VtpassVerifyContent } | null;
    const c = body?.content;
    // Success carries Customer_Name; a bad meter carries content.error and no name.
    if (!c || !c.Customer_Name) {
      notFound(
        `Meter ${meterNumber} on ${disco} (${meterType})`,
        c?.error || "Check the meter number, DisCo (call list_discos) and meter type (prepaid/postpaid).",
      );
    }
    // Prefer VTpass's authoritative on-file meter type and fail closed if it contradicts the
    // request (mirrors the mock's honest validation) — never echo an unverified type as fact.
    const onFile = typeof c.Meter_Type === "string" ? c.Meter_Type.trim().toLowerCase() : "";
    if (onFile && onFile !== type) {
      notFound(
        `Meter ${meterNumber} on ${disco} as ${meterType}`,
        `This meter is registered as ${onFile} on ${disco}, not ${meterType}.`,
      );
    }
    return stamp(
      {
        meterNumber: c.Meter_Number || meterNumber.trim(),
        customerName: c.Customer_Name ?? null,
        address: c.Address ?? null,
        disco: this.serviceCode?.get(serviceID) ?? serviceID,
        meterType: onFile || type,
      },
      this.name,
    );
  }

  async listDiscos(): Promise<Disco[]> {
    return (await this.loadServices()).list;
  }
}
