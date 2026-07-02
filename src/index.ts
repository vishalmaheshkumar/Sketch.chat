import { fileURLToPath } from "node:url";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerGenerateDiagram } from "./tools/generateDiagram.js";
import { registerEditDiagram } from "./tools/editDiagram.js";
import { registerExportDiagram } from "./tools/exportDiagram.js";
import { registerValidateDiagram } from "./tools/validateDiagram.js";
import { registerGetGuideline } from "./tools/getGuideline.js";
import { closeBrowser } from "./render.js";
import { stopDrawioServer } from "./drawioServer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "..", ".env") });

const server = new McpServer({ name: "ai-diagram", version: "0.1.0" });

registerGenerateDiagram(server);
registerEditDiagram(server);
registerExportDiagram(server);
registerValidateDiagram(server);
registerGetGuideline(server);

async function shutdown(): Promise<void> {
  await closeBrowser();
  await stopDrawioServer();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const transport = new StdioServerTransport();
await server.connect(transport);
