/**
 * Environment configuration for the Nigeria MCP core.
 * No hardcoded secrets — everything comes from process.env. Only SHIPPED lanes are named
 * here (this package is published publicly); any other lane reads its own var via providerKey().
 */

export interface Config {
  bankProvider: string;
  fxProvider: string;
  electricityProvider: string;
  tradeProvider: string;
  apiKeys: string[];
  port: number;
  cacheTtlSeconds: number;
  paystackSecretKey?: string;
  vtpassApiKey?: string;
  vtpassPublicKey?: string;
  vtpassSecretKey?: string;
  vtpassBaseUrl: string;
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    bankProvider: env.BANK_PROVIDER ?? "mock",
    fxProvider: env.FX_PROVIDER ?? "mock",
    electricityProvider: env.ELECTRICITY_PROVIDER ?? "mock",
    tradeProvider: env.TRADE_PROVIDER ?? "mock",
    apiKeys: (env.API_KEYS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    port: num(env.PORT, 8787),
    cacheTtlSeconds: num(env.CACHE_TTL_SECONDS, 300),
    paystackSecretKey: env.PAYSTACK_SECRET_KEY,
    vtpassApiKey: env.VTPASS_API_KEY,
    vtpassPublicKey: env.VTPASS_PUBLIC_KEY,
    vtpassSecretKey: env.VTPASS_SECRET_KEY,
    // sandbox by default; set VTPASS_BASE_URL=https://vtpass.com/api + live keys for production
    vtpassBaseUrl: env.VTPASS_BASE_URL ?? "https://sandbox.vtpass.com/api",
  };
}
