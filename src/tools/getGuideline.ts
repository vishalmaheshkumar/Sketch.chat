import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { COPY_GUIDELINE } from "../mxgraphPrompt.js";

export function registerGetGuideline(server: McpServer): void {
  server.tool(
    "get_prompt_guideline",
    "Returns a copy-pasteable guideline explaining drawio's mxGraph XML format and this tool's conventions (color theming, ids, layout). Hand this to another LLM (e.g. ChatGPT) along with a brainstormed diagram idea so it can produce XML this tool can load directly.",
    {},
    async () => ({
      content: [{ type: "text" as const, text: COPY_GUIDELINE }],
    })
  );
}
