# AI Diagram

An independent MCP (Model Context Protocol) server and web UI for AI-driven diagramming, built on
top of the real, open-source [drawio](https://github.com/jgraph/drawio) editor (Apache License 2.0)
and [Google Gemini](https://ai.google.dev/). **AI Diagram is not affiliated with, endorsed by, or
sponsored by JGraph Ltd / draw.io AG** — see [NOTICE.md](NOTICE.md) for full third-party attribution.

## How it works

- `vendor/drawio` is a git submodule pinned to the upstream `jgraph/drawio` repo. It vendors the
  drawio webapp (`src/main/webapp`) — the actual editor, not a reimplementation.
- On demand, the server starts a local static file server for that webapp
  ([src/drawioServer.ts](src/drawioServer.ts)) and drives it headlessly with Puppeteer
  ([src/render.ts](src/render.ts)), speaking drawio's real
  [embed / postMessage protocol](https://www.drawio.com/doc/faq/embed-mode) (`action: 'load'`,
  `action: 'export'`) to render and export diagrams exactly as the real app would.
- Gemini ([src/gemini.ts](src/gemini.ts)) generates and edits the mxGraph XML from natural-language
  prompts, with automatic fallback across `GEMINI_MODELS` if a model errors out. Generation and
  editing both run with Gemini 2.5's extended thinking enabled (dynamic budget), and the shared
  prompt ([src/mxgraphPrompt.ts](src/mxgraphPrompt.ts)) instructs the model to auto-pick a coherent
  color palette per shape category and a fitting canvas background, and to reuse existing ids/colors
  when editing rather than reinventing the diagram.

## Tools (MCP)

| Tool | Purpose |
| --- | --- |
| `generate_diagram` | Create a new `.drawio` file from a text description |
| `edit_diagram` | Modify an existing diagram (by file name or raw XML) with an instruction |
| `export_diagram` | Render via headless drawio and export to `png`, `svg`, or normalized `xml` |
| `validate_diagram` | Load XML into the real editor to confirm it parses/renders without error |
| `get_prompt_guideline` | Returns the mxGraph XML rules as copy-pasteable text for another LLM |

Diagrams and exports are written to `output/`. Tools that take a diagram accept either `file`
(a name previously returned by another tool, resolved under `output/`) or raw `xml`, so you can
chain generate → edit → export without round-tripping large XML through the model context.

## Standalone web UI (no Claude/MCP needed, LLM-agnostic)

`npm run webui` (or `npm run dev:webui`) starts a local server and opens a browser tab with the real
drawio editor and four actions in the header. It doesn't call Gemini itself — it's a bridge between
the real drawio editor and whatever LLM chat you're already using (ChatGPT, Claude, Gemini, etc.):

- **Copy XML** — copies the current diagram's mxGraph XML to your clipboard, to paste into an LLM
  chat along with your next instruction.
- **Copy Guideline** — copies the mxGraph XML rules (color theming, ids, layout conventions) this
  project's own MCP tools give Gemini, so any LLM you paste it to knows how to reply in a format
  this app can load.
- **Paste XML** — opens a dialog to paste that LLM's raw XML reply, loading it straight onto the
  canvas, fully editable in the real drawio UI.
- **Export PNG** — exports the current diagram as a PNG.
- **3D View** — extrudes the current diagram's nodes/edges into an interactive, orbitable 3D scene
  (via [Three.js](https://threejs.org), loaded lazily from a CDN only when clicked). This is purely
  a visualization layer on top of the same mxGraph XML — it doesn't change the diagram format, so
  Copy/Paste XML and any LLM's output are unaffected.
- **Help** (header, `?` icon) — reopens the onboarding overlay explaining the loop below; it also
  shows automatically the first time you visit.

Typical loop: brainstorm a diagram in any chat → **Copy Guideline**, paste it into that chat →
paste its XML reply via **Paste XML** → iterate by **Copy XML**, asking that chat for a change,
and **Paste XML** again.

### Hosting the web UI on GitHub Pages

The web UI has no server-side runtime dependency (Copy XML / Copy Guideline / Paste XML / Export
PNG / theme toggle are all client-side; the guideline text is inlined at build time), so it can be
published as a fully static site — the MCP tools and Gemini calls above stay local-only and are a
separate interface.

```bash
npm run build:pages   # writes a static site to docs/
```

This copies drawio's webapp into `docs/editor/` (plus its `LICENSE`), copies [NOTICE.md](NOTICE.md),
and writes `docs/index.html` with the editor path and guideline text baked in. `docs/` is gitignored
(it's a generated artifact); [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
builds and deploys it automatically on every push to `main`.

One-time setup on GitHub: **Settings → Pages → Source: "GitHub Actions"**. After that, pushing to
`main` publishes the latest build automatically.

## Setup

```bash
git clone --recurse-submodules <this-repo>
# or, if already cloned:
git submodule update --init

cp .env.example .env   # then fill in GEMINI_API_KEY
npm install
npm run build
```

`GEMINI_API_KEY` is required. `GEMINI_MODELS` is optional (defaults to
`gemini-2.5-flash,gemini-2.5-pro,gemini-2.5-flash-lite-preview-06-17`); the server tries each in
order until one succeeds.

## Running

```bash
npm run dev     # ts-node/tsx, no build step
# or
npm run build && npm start
```

The server speaks MCP over stdio.

## Using with Claude Code / Claude Desktop

Add to your MCP config (e.g. `.mcp.json` or Claude Desktop's config):

```json
{
  "mcpServers": {
    "ai-diagram": {
      "command": "node",
      "args": ["/absolute/path/to/AI_Diagram/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-api-key"
      }
    }
  }
}
```

## Notes / limitations

- PDF export is not wired up: drawio's lightweight embed/export postMessage protocol only reliably
  supports `png`, `svg`, and `xml` — full PDF export in upstream drawio goes through a different,
  heavier code path (multi-page layout, jsPDF) that isn't exposed over postMessage.
- The Gemini API key in `.env` is excluded from git via `.gitignore`. Treat any key committed to
  chat history or shared elsewhere as already exposed — rotate it in Google AI Studio if it's not
  meant to be shared long-term.
- Third-party licensing: drawio (`vendor/drawio`) is vendored unmodified as a git submodule under
  the Apache License, Version 2.0. See [NOTICE.md](NOTICE.md) for full attribution and the
  trademark disclaimer.
