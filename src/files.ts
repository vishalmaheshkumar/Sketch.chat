import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = path.resolve(__dirname, "..", "output");

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "diagram"
  );
}

/** Resolves a user-supplied filename to a path inside OUTPUT_DIR, rejecting traversal. */
export function resolveOutputFile(name: string): string {
  const resolved = path.resolve(OUTPUT_DIR, name);
  if (!resolved.startsWith(OUTPUT_DIR + path.sep) && resolved !== OUTPUT_DIR) {
    throw new Error(`Invalid file name: ${name}`);
  }
  return resolved;
}

export async function ensureOutputDir(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

export async function writeOutputFile(name: string, data: Buffer | string): Promise<string> {
  await ensureOutputDir();
  const filePath = resolveOutputFile(name);
  await fs.writeFile(filePath, data);
  return filePath;
}

export async function readOutputFile(name: string): Promise<string> {
  const filePath = resolveOutputFile(name);
  return fs.readFile(filePath, "utf8");
}

export function timestampedName(base: string, ext: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${slugify(base)}-${stamp}.${ext}`;
}
