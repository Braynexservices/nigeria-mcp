/**
 * Actionable errors. Tool handlers throw ToolError with a hint; buildServer converts any
 * throw into a clean, agent-readable tool result.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export class ToolError extends Error {
  constructor(
    message: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = "ToolError";
  }
}

/** Throw a not-found error with an optional next-step hint for the agent. */
export function notFound(what: string, hint?: string): never {
  throw new ToolError(`${what} not found.`, hint);
}

/** Convert any error into a CallToolResult with isError + a helpful message. */
export function toToolResult(err: unknown): CallToolResult {
  const message =
    err instanceof ToolError
      ? err.hint
        ? `${err.message} ${err.hint}`
        : err.message
      : err instanceof Error
        ? err.message
        : String(err);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}
