/**
 * Transport-agnostic MCP server builder. Lanes hand buildServer() an array of ToolDefs;
 * stdio.ts and http.ts wrap the result in a transport.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z, type ZodRawShape } from "zod";
import { toToolResult } from "./lib/errors.js";
import { nowIso } from "./lib/normalize.js";

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  openWorldHint?: boolean;
  idempotentHint?: boolean;
  destructiveHint?: boolean;
}

export interface ToolDef {
  name: string;
  title?: string;
  description: string;
  inputSchema: ZodRawShape;
  outputSchema?: ZodRawShape;
  annotations?: ToolAnnotations;
  handler: (args: Record<string, unknown>) => Promise<CallToolResult>;
}

export interface BuildServerOptions {
  name?: string;
  version?: string;
}

export function buildServer(tools: ToolDef[], opts: BuildServerOptions = {}): McpServer {
  const server = new McpServer({
    name: opts.name ?? "nigeria-mcp",
    version: opts.version ?? "0.0.0",
  });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title ?? tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        // Lookup tools are read-only and talk to the outside world by default.
        annotations: { readOnlyHint: true, openWorldHint: true, ...tool.annotations },
        // Cast at the SDK boundary: the generic ties the callback to the inferred schema,
        // but our ToolDef handler uses a uniform Record signature.
      } as Parameters<McpServer["registerTool"]>[1],
      (async (args: Record<string, unknown>) => {
        try {
          return await tool.handler(args ?? {});
        } catch (err) {
          return toToolResult(err);
        }
      }) as Parameters<McpServer["registerTool"]>[2],
    );
  }

  return server;
}

/** Throwaway health tool used to smoke-test transports. Safe to keep; harmless. */
export const pingTool: ToolDef = {
  name: "ping",
  title: "Ping",
  description: "Health check — returns pong and the server time.",
  inputSchema: {},
  outputSchema: { pong: z.boolean(), time: z.string() },
  handler: async () => {
    const time = nowIso();
    return {
      content: [{ type: "text", text: `pong @ ${time}` }],
      structuredContent: { pong: true, time },
    };
  },
};
