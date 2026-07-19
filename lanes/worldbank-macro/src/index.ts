/**
 * @braynexservices/nigeria-mcp-worldbank-macro — Nigerian macro indicators lane (World Bank).
 * Exposes its tools + providers for composition into the combined server (and the stdio entrypoint).
 */
export { macroTools, resolveIndicator } from "./tools.js";
export { getMacroProvider } from "./provider.js";
export { MockMacroProvider } from "./providers/mock.js";
export { WorldBankMacroProvider } from "./providers/worldbank.js";
export { SERIES, type FixtureSeries } from "./fixtures.js";
export {
  INDICATOR_ALIASES,
  MacroPoint,
  NormalizedMacroSeries,
  type IndicatorAlias,
  type MacroProvider,
} from "./schema.js";
