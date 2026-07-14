/**
 * Generic provider factory. Each lane builds a registry of { key -> factory } and calls
 * selectProvider() with the env-selected key. Keeps provider selection uniform + typed.
 */
export type ProviderFactory<T> = () => T;
export type ProviderRegistry<T> = Record<string, ProviderFactory<T>>;

export function selectProvider<T>(
  kind: string,
  key: string,
  registry: ProviderRegistry<T>,
): T {
  const factory = registry[key];
  if (!factory) {
    const available = Object.keys(registry).join(", ") || "(none)";
    throw new Error(
      `Unknown ${kind} provider "${key}". Available: ${available}. Set the provider env var accordingly.`,
    );
  }
  return factory();
}

/**
 * Read a lane's provider key straight from the environment, e.g. providerKey("FX_PROVIDER").
 * Lets a lane select its provider without the core package having to name that lane.
 */
export function providerKey(envVar: string, fallback = "mock"): string {
  return process.env[envVar] ?? fallback;
}
