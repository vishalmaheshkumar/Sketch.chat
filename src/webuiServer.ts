import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { ensureDrawioServer } from "./drawioServer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "..", ".env") });

const url = await ensureDrawioServer();
console.log(`AI Diagram running at ${url}`);

const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
exec(`${openCommand} "${url}"`);
