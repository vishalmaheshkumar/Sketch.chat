import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateWithFallback, extractXml } from "../gemini.js";
import { MXGRAPH_SYSTEM_INSTRUCTION } from "../mxgraphPrompt.js";
import { readOutputFile, writeOutputFile, timestampedName } from "../files.js";

export function registerEditDiagram(server: McpServer): void {
  server.tool(
    "edit_diagram",
    "Edit an existing drawio diagram using Gemini, given a natural-language instruction. Provide either 'file' (a .drawio file name previously returned by generate_diagram/export_diagram) or the raw 'xml'. Saves the result as a new file under output/.",
    {
      instruction: z.string().describe("What to change, e.g. 'add a database node connected to the API service'"),
      file: z.string().optional().describe("File name under output/ to load the current XML from"),
      xml: z.string().optional().describe("Raw current mxGraph XML (alternative to 'file')"),
      fileName: z.string().optional().describe("Optional base name for the saved .drawio file (without extension)"),
    },
    async ({ instruction, file, xml, fileName }) => {
      const currentXml = xml ?? (file ? await readOutputFile(file) : null);
      if (!currentXml) {
        throw new Error("Provide either 'file' or 'xml' with the diagram to edit");
      }

      const prompt = `Current diagram XML:\n${currentXml}\n\nInstruction: ${instruction}\n\nReturn the complete, updated mxGraph XML.`;
      const raw = await generateWithFallback(MXGRAPH_SYSTEM_INSTRUCTION, prompt, { thinkingBudget: -1 });
      const updatedXml = extractXml(raw);

      const name = timestampedName(fileName ?? file ?? instruction, "drawio");
      const filePath = await writeOutputFile(name, updatedXml);

      return {
        content: [
          {
            type: "text" as const,
            text: `Saved edited diagram to ${filePath}\n\n${updatedXml}`,
          },
        ],
      };
    }
  );
}
