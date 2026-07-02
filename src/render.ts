import puppeteer, { type Browser, type Page } from "puppeteer";
import { EventEmitter } from "node:events";
import { ensureDrawioServer } from "./drawioServer.js";

export type ExportFormat = "png" | "svg" | "xml";

interface DrawioMessage {
  event?: string;
  action?: string;
  format?: string;
  data?: string;
  xml?: string;
  message?: unknown;
  [key: string]: unknown;
}

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      channel: "chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

function waitForMessage(
  bus: EventEmitter,
  predicate: (msg: DrawioMessage) => boolean,
  timeoutMs: number
): Promise<DrawioMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      bus.off("message", handler);
      reject(new Error("Timed out waiting for drawio to respond"));
    }, timeoutMs);

    const handler = (msg: DrawioMessage) => {
      if (msg.event === "dialog") {
        clearTimeout(timer);
        bus.off("message", handler);
        reject(new Error(`drawio reported an error: ${String(msg.message ?? "unknown error")}`));
        return;
      }
      if (predicate(msg)) {
        clearTimeout(timer);
        bus.off("message", handler);
        resolve(msg);
      }
    };

    bus.on("message", handler);
  });
}

async function openEditorPage(): Promise<{ page: Page; bus: EventEmitter }> {
  const baseUrl = await ensureDrawioServer();
  const browser = await getBrowser();
  const page = await browser.newPage();
  const bus = new EventEmitter();

  await page.exposeFunction("__drawioEvent", (raw: string) => {
    try {
      bus.emit("message", JSON.parse(raw) as DrawioMessage);
    } catch {
      // non-JSON postMessage traffic (e.g. React devtools pings) is ignored
    }
  });

  // drawio's embed handshake only runs when it detects `window.parent !== window`
  // (or window.opener), so it must be loaded inside an iframe, not top-level.
  await page.setContent(
    '<!doctype html><html><body style="margin:0"><iframe id="drawio" style="width:1024px;height:1024px;border:0;"></iframe></body></html>'
  );

  await page.evaluate(() => {
    window.addEventListener("message", (e: MessageEvent) => {
      if (typeof e.data === "string") {
        (window as unknown as { __drawioEvent: (raw: string) => void }).__drawioEvent(e.data);
      }
    });
  });

  const url = `${baseUrl}/index.html?embed=1&proto=json&spin=1&noSaveBtn=1&noExitBtn=1&ui=min`;
  await page.evaluate((src) => {
    const iframe = document.getElementById("drawio") as HTMLIFrameElement;
    iframe.src = src;
  }, url);

  await waitForMessage(bus, (m) => m.event === "init", 30000);

  return { page, bus };
}

async function postToPage(page: Page, msg: Record<string, unknown>): Promise<void> {
  await page.evaluate((json) => {
    const iframe = document.getElementById("drawio") as HTMLIFrameElement;
    iframe.contentWindow!.postMessage(json, "*");
  }, JSON.stringify(msg));
}

export interface ExportResult {
  format: ExportFormat;
  /** base64 data URI for png/svg, raw XML text for xml */
  data: string;
  xml: string;
}

export async function exportDiagram(xml: string, format: ExportFormat): Promise<ExportResult> {
  const { page, bus } = await openEditorPage();
  try {
    await postToPage(page, { action: "load", xml, autosave: 1 });
    await waitForMessage(bus, (m) => m.event === "load", 20000);

    await postToPage(page, { action: "export", format, xml });
    const result = await waitForMessage(bus, (m) => m.event === "export", 30000);

    return {
      format,
      data: String(result.data ?? result.xml ?? ""),
      xml: String(result.xml ?? xml),
    };
  } finally {
    await page.close();
  }
}

export async function validateDiagram(xml: string): Promise<{ valid: boolean; error?: string }> {
  try {
    await exportDiagram(xml, "xml");
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
