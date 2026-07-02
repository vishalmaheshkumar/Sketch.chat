# Third-party notices

**AI Diagram** is an independent project. It is not affiliated with, endorsed by, or sponsored by
JGraph Ltd, draw.io AG, or the drawio/diagrams.net project. "draw.io" and "diagrams.net" are
trademarks of their respective owners.

## drawio

This project embeds and serves, unmodified, the drawio editor web application from:

- Repository: https://github.com/jgraph/drawio
- Copyright (c) JGraph Holdings Ltd / draw.io AG
- License: Apache License, Version 2.0

The full license text is vendored at [vendor/drawio/LICENSE](vendor/drawio/LICENSE) (drawio is
included as a git submodule at `vendor/drawio`, pinned to a specific upstream commit). No changes
have been made to drawio's source; it is served as-is (see [src/drawioServer.ts](src/drawioServer.ts))
and driven only through its documented, public embed/export postMessage protocol
(see [src/render.ts](src/render.ts), [src/webui.ts](src/webui.ts)).

A copy of the Apache License, Version 2.0 also applies to any portions of drawio's source
reproduced here; see http://www.apache.org/licenses/LICENSE-2.0 for the full terms.

## This project's own code

All other source in this repository (the MCP server, the standalone web UI, the Gemini
integration) is original work by the AI Diagram project and is not part of drawio.
