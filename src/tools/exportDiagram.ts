import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exportDiagram, type ExportFormat } from "../render.js";
import { readOutputFile, writeOutputFile, timestampedName } from "../files.js";

function decodeDataUri(dataUri: string): Buffer {
  const match = dataUri.match(/^data:[^;]+;base64,(.*)$/s);
  return Buffer.from(match ? match[1] : dataUri, "base64");
}

export function registerExportDiagram(server: McpServer): void {
  server.tool(
    "export_diagram",
    "Render a drawio diagram using the real drawio editor (headless Chromium) and export it to png, svg, or normalized xml. Provide either 'file' or 'xml'.",
    {
      format: z.enum(["png", "svg", "xml"]).describe("Output format"),
      file: z.string().optional().describe("File name under output/ containing the diagram XML"),
      xml: z.string().optional().describe("Raw mxGraph XML (alternative to 'file')"),
      fileName: z.string().optional().describe("Optional base name for the exported file (without extension)"),
    },
    async ({ format, file, xml, fileName }) => {
      const currentXml = xml ?? (file ? await readOutputFile(file) : null);
      if (!currentXml) {
        throw new Error("Provide either 'file' or 'xml' with the diagram to export");
      }

      const result = await exportDiagram(currentXml, format as ExportFormat);
      const name = timestampedName(fileName ?? file ?? "diagram", format);

      const filePath =
        format === "xml"
          ? await writeOutputFile(name, result.data)
          : await writeOutputFile(name, decodeDataUri(result.data));

      return {
        content: [
          {
            type: "text" as const,
            text: `Exported ${format} to ${filePath}`,
          },
        ],
      };
    }
  );
}
