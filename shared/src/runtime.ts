/**
 * Transport runners. Lanes call startStdio() with their tools so they never import the
 * MCP SDK transport directly — all SDK wiring stays in core.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer, type ToolDef, type BuildServerOptions } from "./server.js";

/** Build a server from the given tools and serve it over stdio (local use). */
export async function startStdio(tools: ToolDef[], opts: BuildServerOptions = {}): Promise<void> {
  const server = buildServer(tools, opts);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${opts.name ?? "nigeria-mcp"}] stdio connected (${tools.length} tools)`);
}
