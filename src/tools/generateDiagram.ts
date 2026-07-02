import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateWithFallback, extractXml } from "../gemini.js";
import { MXGRAPH_SYSTEM_INSTRUCTION } from "../mxgraphPrompt.js";
import { writeOutputFile, timestampedName } from "../files.js";

export function registerGenerateDiagram(server: McpServer): void {
  server.tool(
    "generate_diagram",
    "Generate a new drawio (.drawio, mxGraph XML) diagram from a natural-language description using Gemini. Saves the file under output/ and returns its path and XML.",
    {
      description: z.string().describe("What the diagram should show, e.g. 'a login flow with three services'"),
      fileName: z.string().optional().describe("Optional base name for the saved .drawio file (without extension)"),
    },
    async ({ description, fileName }) => {
      const raw = await generateWithFallback(MXGRAPH_SYSTEM_INSTRUCTION, description, { thinkingBudget: -1 });
      const xml = extractXml(raw);

      const name = timestampedName(fileName ?? description, "drawio");
      const filePath = await writeOutputFile(name, xml);

      return {
        content: [
          {
            type: "text" as const,
            text: `Saved diagram to ${filePath}\n\n${xml}`,
          },
        ],
      };
    }
  );
}
