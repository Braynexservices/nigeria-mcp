# `shared/` — `@braynexservices/nigeria-mcp-core`

The shared MCP core consumed by every lane. **No lane logic lives here** — only the reusable spine.

## Will contain (built in v1)
```
shared/src/
├── server.ts        # buildServer(): new McpServer(), accepts tool registrations
├── stdio.ts         # StdioServerTransport entrypoint (local, no auth)
├── http.ts          # Express + stateless StreamableHTTPServerTransport + API-key auth + /health
├── config.ts        # env parsing, provider selection, key list
├── schemas.ts       # shared Zod base types + Normalized* contracts
├── providers/types.ts  # typed provider interfaces per shipped lane (the seam)
└── lib/
    ├── normalize.ts # raw → normalized helpers
    ├── errors.ts    # actionable MCP error helpers
    └── cache.ts     # in-memory TTL cache (Redis-swappable)
```

## Design rules
- The **provider seam** (typed interfaces) is the core idea — tools depend on interfaces, never concrete providers.
- Normalized schema stability > provider breadth.

