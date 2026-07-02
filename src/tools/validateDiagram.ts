import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateDiagram } from "../render.js";
import { readOutputFile } from "../files.js";

export function registerValidateDiagram(server: McpServer): void {
  server.tool(
    "validate_diagram",
    "Load a diagram into the real drawio editor (headless) to confirm the XML parses and renders without errors. Provide either 'file' or 'xml'.",
    {
      file: z.string().optional().describe("File name under output/ containing the diagram XML"),
      xml: z.string().optional().describe("Raw mxGraph XML (alternative to 'file')"),
    },
    async ({ file, xml }) => {
      const currentXml = xml ?? (file ? await readOutputFile(file) : null);
      if (!currentXml) {
        throw new Error("Provide either 'file' or 'xml' with the diagram to validate");
      }

      const result = await validateDiagram(currentXml);

      return {
        content: [
          {
            type: "text" as const,
            text: result.valid ? "Diagram is valid." : `Diagram is invalid: ${result.error}`,
          },
        ],
        isError: !result.valid,
      };
    }
  );
}
