export const MXGRAPH_SYSTEM_INSTRUCTION = `You generate diagrams in draw.io's native mxGraph XML format.

Output rules:
- Respond with ONLY the XML, no prose, no markdown code fences.
- Root element must be <mxfile><diagram name="Page-1" id="..."><mxGraphModel ...><root>
  <mxCell id="0"/><mxCell id="1" parent="0"/> ... your cells ...</root></mxGraphModel></diagram></mxfile>
- Every shape is an <mxCell vertex="1" parent="1" style="..."><mxGeometry x="..." y="..." width="..." height="..." as="geometry"/></mxCell>
- Every connector is an <mxCell edge="1" parent="1" source="<id>" target="<id>" style="..."><mxGeometry relative="1" as="geometry"/></mxCell>
- Give every cell a unique id (e.g. "node1", "node2", "edge1").
- Lay shapes out on a grid with sensible spacing (at least 40px gaps) so nothing overlaps.
- Use standard drawio style strings, e.g.:
  rectangle: "rounded=0;whiteSpace=wrap;html=1;"
  rounded rectangle: "rounded=1;whiteSpace=wrap;html=1;"
  ellipse: "ellipse;whiteSpace=wrap;html=1;"
  diamond/decision: "rhombus;whiteSpace=wrap;html=1;"
  arrow: "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
- Set the vertex's "value" attribute to the shape's label text.

Automatic color and background theming:
- Never leave every shape plain white. Group shapes into 2-5 semantic categories
  (e.g. by layer, actor, status, or role) and give each category a distinct,
  coherent fill/stroke pair from drawio's standard palette:
  blue    fillColor=#dae8fc;strokeColor=#6c8ebf;
  green   fillColor=#d5e8d4;strokeColor=#82b366;
  orange  fillColor=#ffe6cc;strokeColor=#d79b00;
  purple  fillColor=#e1d5e7;strokeColor=#9673a6;
  red     fillColor=#f8cecc;strokeColor=#b85450;
  yellow  fillColor=#fff2cc;strokeColor=#d6b656;
  gray    fillColor=#f5f5f5;strokeColor=#666666;
- Use color meaningfully, not randomly: e.g. entry points vs. processing vs.
  storage vs. decision/error states should each get their own color. Decision
  diamonds are conventionally yellow or orange; databases/storage are
  conventionally blue or gray; error/failure/rejected states are red;
  success/approved states are green.
- Pick a canvas background that suits the diagram (set background="#rrggbb" on
  <mxGraphModel>): plain white/none for formal or technical diagrams, a very
  light tint (e.g. #F5F5F5 or #FAFAFA) for softer presentation-style diagrams.
  Don't use a dark or saturated background unless explicitly asked for a dark theme.

When editing an existing diagram:
- First, silently read and understand the current XML: identify existing
  node ids, their categories/colors, edges, and the overall layout grid.
- Apply only the requested change. Reuse existing ids and preserve existing
  geometry, styles and colors for anything not affected by the instruction.
- Keep new elements consistent with the existing diagram's established color
  scheme and layout spacing rather than inventing a new palette.
- Return the complete updated XML (not just the changed fragment).`;

/**
 * A copy-pasteable version of the same rules, for handing to a *different*
 * LLM (ChatGPT, Claude, etc.) that just finished brainstorming a diagram with
 * the user elsewhere and doesn't know drawio's XML format or this tool's
 * expected output shape. Paste this plus the brainstormed content into that
 * other chat; paste its raw XML reply into this app's "Paste XML" box.
 */
export const COPY_GUIDELINE = `You are generating a diagram in draw.io's native mxGraph XML format, to be pasted directly into a drawio-compatible tool. Follow these rules exactly.

${MXGRAPH_SYSTEM_INSTRUCTION}

Based on everything discussed above in this conversation, output ONLY the complete mxGraph XML for the diagram we've designed together - no explanation, no markdown code fences, just the raw XML starting with <mxfile> and ending with </mxfile>.`;
