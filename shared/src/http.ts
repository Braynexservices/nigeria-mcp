/**
 * Streamable-HTTP entrypoint — stateless, deployable. API-key auth + /health.
 * Stateless mode (sessionIdGenerator: undefined) is simpler to scale. A fresh server +
 * transport is created per request.
 */
import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { loadConfig } from "./config.js";
import { buildServer, pingTool } from "./server.js";

const config = loadConfig();
const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "nigeria-mcp" });
});

function authorized(req: Request): boolean {
  // No keys configured => open (local dev). Configure API_KEYS to enforce.
  if (config.apiKeys.length === 0) return true;
  const fromHeader = req.header("x-api-key");
  const bearer = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const key = fromHeader ?? bearer;
  return !!key && config.apiKeys.includes(key);
}

app.post("/mcp", async (req: Request, res: Response) => {
  if (!authorized(req)) {
    res
      .status(401)
      .json({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null });
    return;
  }

  const server = buildServer([pingTool]);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(config.port, () => {
  console.error(
    `[nigeria-mcp] HTTP listening on :${config.port} (auth: ${config.apiKeys.length ? "on" : "off"})`,
  );
});
