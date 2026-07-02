import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { renderWebuiHtml } from "../src/webui.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WEBAPP_SRC = path.join(ROOT, "vendor", "drawio", "src", "main", "webapp");
const OUT_DIR = path.join(ROOT, "docs");
const EDITOR_OUT = path.join(OUT_DIR, "editor");

async function main(): Promise<void> {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  // The drawio editor is served from its own subpath so its internal
  // relative asset references (js/app.min.js, mxgraph/css/...) resolve
  // correctly regardless of what path this site is published under.
  await fs.cp(WEBAPP_SRC, EDITOR_OUT, { recursive: true });
  await fs.copyFile(path.join(ROOT, "vendor", "drawio", "LICENSE"), path.join(EDITOR_OUT, "LICENSE"));
  await fs.copyFile(path.join(ROOT, "NOTICE.md"), path.join(OUT_DIR, "NOTICE.md"));

  // Skip Jekyll processing - this is a plain static site.
  await fs.writeFile(path.join(OUT_DIR, ".nojekyll"), "");

  const html = renderWebuiHtml({ editorPath: "editor/index.html" });
  await fs.writeFile(path.join(OUT_DIR, "index.html"), html);

  console.log(`Built static site at ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
