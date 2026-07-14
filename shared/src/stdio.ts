/**
 * Core stdio entrypoint — ships only the ping tool. Lanes provide their own entrypoints
 * that pass their tools to startStdio().
 */
import { startStdio } from "./runtime.js";
import { pingTool } from "./server.js";

await startStdio([pingTool]);
