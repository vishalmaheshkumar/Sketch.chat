import { createServer, type Server } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import serveHandler from "serve-handler";
import { renderWebuiHtml } from "./webui.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The submodule at vendor/drawio only vendors the upstream webapp source
// (src/main/webapp) so it can be served as-is; drawio has no build step for
// the parts this project drives (the editor UI and its embed/export protocol).
const WEBAPP_ROOT = path.resolve(__dirname, "..", "vendor", "drawio", "src", "main", "webapp");

const WEBUI_HTML = renderWebuiHtml({ editorPath: "/index.html" });

let server: Server | null = null;
let serverUrl: string | null = null;

export async function ensureDrawioServer(): Promise<string> {
  if (server && serverUrl) {
    return serverUrl;
  }

  server = createServer((req, res) => {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

    if (pathname === "/" || pathname === "/ai.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(WEBUI_HTML);
      return;
    }

    // cleanUrls defaults to true and would 301-redirect /index.html -> /,
    // dropping the ?embed=1&proto=json... query string drawio's embed mode needs.
    serveHandler(req, res, { public: WEBAPP_ROOT, cleanUrls: false, directoryListing: false });
  });

  await new Promise<void>((resolve, reject) => {
    server!.once("error", reject);
    server!.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Failed to determine drawio server address");
  }

  serverUrl = `http://127.0.0.1:${address.port}`;
  return serverUrl;
}

export async function stopDrawioServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
    serverUrl = null;
  }
}
