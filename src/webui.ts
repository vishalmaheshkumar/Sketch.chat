import { COPY_GUIDELINE } from "./mxgraphPrompt.js";

export interface WebuiOptions {
  /** Path to drawio's own index.html, relative to this page (no query string). */
  editorPath: string;
}

export function renderWebuiHtml({ editorPath }: WebuiOptions): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Diagram</title>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
<script>
  // Set the theme before first paint to avoid a flash of the wrong theme.
  (function () {
    var saved = localStorage.getItem('ai-diagram-theme');
    var theme = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  })();
</script>
<style>
  :root {
    /* The top bar always stays dark, independent of the light/dark toggle below. */
    --header-bg: #171a21;
    --header-panel-2: #1f2330;
    --header-hover-bg: #262b3a;
    --header-hover-border: #3a4152;
    --header-border: #2a2f3d;
    --header-text: #e7e9ee;
    --header-muted: #8b91a3;
    --radius: 10px;
  }
  :root, [data-theme="dark"] {
    --bg: #0f1115;
    --panel: #171a21;
    --panel-2: #1f2330;
    --hover-bg: #262b3a;
    --hover-border: #3a4152;
    --border: #2a2f3d;
    --text: #e7e9ee;
    --muted: #8b91a3;
    --accent: #6366f1;
    --accent-hover: #7678f5;
    --success: #22c55e;
    --error: #ef4444;
    --textarea-bg: #0c0e13;
    --overlay-bg: rgba(10, 11, 15, 0.6);
  }
  [data-theme="light"] {
    --bg: #f4f5f8;
    --panel: #ffffff;
    --panel-2: #f0f1f5;
    --hover-bg: #e6e8ee;
    --hover-border: #c9cddb;
    --border: #e1e3ea;
    --text: #14161f;
    --muted: #6b7080;
    --accent: #6366f1;
    --accent-hover: #4f52e0;
    --success: #16a34a;
    --error: #dc2626;
    --textarea-bg: #fafafc;
    --overlay-bg: rgba(20, 22, 31, 0.35);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }

  header {
    /* Shadow the theme-toggle variables with fixed values for everything
       inside the header, so the top bar never changes with the toggle. */
    --panel: var(--header-bg);
    --panel-2: var(--header-panel-2);
    --hover-bg: var(--header-hover-bg);
    --hover-border: var(--header-hover-border);
    --border: var(--header-border);
    --text: var(--header-text);
    --muted: var(--header-muted);

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 20px;
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand svg { flex-shrink: 0; }
  .brand h1 { font-size: 15px; font-weight: 600; margin: 0; letter-spacing: 0.2px; }
  .brand p { font-size: 12px; color: var(--muted); margin: 0; }

  .actions { display: flex; align-items: center; gap: 8px; }

  button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--panel-2);
    color: var(--text);
    cursor: pointer;
    transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease;
  }
  button:hover { background: var(--hover-bg); border-color: var(--hover-border); }
  button:active { transform: scale(0.97); }
  button:disabled { opacity: 0.5; cursor: default; transform: none; }
  button.primary { background: var(--accent); border-color: var(--accent); color: white; }
  button.primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
  button svg { width: 15px; height: 15px; }

  .icon-btn { padding: 8px; }
  .icon-btn svg { width: 17px; height: 17px; }
  .divider { width: 1px; height: 22px; background: var(--border); margin: 0 4px; }
  #themeToggleBtn .sun, #themeToggleBtn .moon { display: none; }
  [data-theme="dark"] #themeToggleBtn .sun { display: block; }
  [data-theme="light"] #themeToggleBtn .moon { display: block; }

  #frameWrap { position: absolute; top: 57px; left: 0; right: 0; bottom: 0; background: var(--bg); }
  iframe { width: 100%; height: 100%; border: 0; display: block; }

  #view3d { position: absolute; top: 57px; left: 0; right: 0; bottom: 0; background: #0f1115; display: none; }
  #view3d.open { display: block; }
  #view3dCanvas { width: 100%; height: 100%; }
  #view3dBar {
    position: absolute; top: 14px; left: 14px; z-index: 5;
    display: flex; align-items: center; gap: 10px;
  }
  #view3dBar span { font-size: 12px; color: #8b91a3; }

  /* Modal */
  .overlay {
    position: fixed; inset: 0; background: var(--overlay-bg);
    backdrop-filter: blur(2px);
    display: none; align-items: center; justify-content: center; z-index: 50;
  }
  .overlay.open { display: flex; }
  .modal {
    width: min(640px, 90vw);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .modal h2 { margin: 0; font-size: 15px; font-weight: 600; }
  .modal p.desc { margin: 0 0 14px; font-size: 12.5px; color: var(--muted); line-height: 1.5; }
  .close-btn { padding: 4px; border: 0; background: transparent; }
  .close-btn:hover { background: var(--hover-bg); }
  .close-btn svg { width: 16px; height: 16px; }
  .steps { margin: 0 0 16px; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .steps li { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.5; }
  .steps .num {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    background: var(--accent); color: white; font-size: 12px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
  }
  .steps b { color: var(--text); }
  .steps span.sub { color: var(--muted); }
  .modal textarea {
    width: 100%; height: 220px; resize: vertical;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12px; line-height: 1.5;
    padding: 10px 12px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--textarea-bg); color: var(--text);
  }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }

  /* Toasts */
  #toasts { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column;
    gap: 8px; z-index: 60; align-items: flex-end; }
  .toast {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 9px; font-size: 13px;
    background: var(--panel-2); border: 1px solid var(--border);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    animation: toast-in 0.18s ease;
    max-width: 380px;
  }
  .toast.success { border-color: rgba(34,197,94,0.4); }
  .toast.error { border-color: rgba(239,68,68,0.5); }
  .toast .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--muted); }
  .toast.success .dot { background: var(--success); }
  .toast.error .dot { background: var(--error); }
  @keyframes toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: currentColor;
    animation: spin 0.7s linear infinite;
  }
</style>
</head>
<body>
  <header>
    <div class="brand">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="8" height="6" rx="1.5" stroke="#6366f1" stroke-width="1.6"/>
        <rect x="14" y="15" width="8" height="6" rx="1.5" stroke="#6366f1" stroke-width="1.6"/>
        <rect x="14" y="3" width="8" height="6" rx="1.5" stroke="#6366f1" stroke-width="1.6"/>
        <path d="M6 9v3a2 2 0 002 2h6M18 9v3a2 2 0 01-2 2h-2" stroke="#6366f1" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <div>
        <h1>AI Diagram</h1>
        <p>The diagram editor for any LLM chat</p>
      </div>
    </div>
    <div class="actions">
      <button id="copyXmlBtn" class="primary" title="Copy the current diagram's XML, to paste into any LLM chat">
        <svg viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M4 16V6a2 2 0 012-2h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        Copy XML
      </button>
      <button id="copyGuidelineBtn" title="Copy the mxGraph format rules to hand to another LLM">
        <svg viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        Copy Guideline
      </button>
      <button id="pasteXmlBtn" title="Paste XML from another LLM's reply onto the canvas">
        <svg viewBox="0 0 24 24" fill="none"><path d="M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.7"/><rect x="6" y="6" width="12" height="15" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        Paste XML
      </button>
      <button id="exportBtn" title="Export the current diagram as a PNG">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        Export PNG
      </button>
      <button id="view3dBtn" title="View the current diagram in 3D">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 3v18M4 7.5l8 4.5 8-4.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        3D View
      </button>
      <div class="divider"></div>
      <button id="helpBtn" class="icon-btn" title="How to use this">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M9.5 9.3a2.5 2.5 0 114.16 1.87c-.6.53-1.16.9-1.16 1.83" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16.7" r="1" fill="currentColor"/></svg>
      </button>
      <button id="themeToggleBtn" class="icon-btn" title="Toggle light / dark mode">
        <svg class="sun" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <svg class="moon" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </header>

  <div id="frameWrap">
    <iframe id="drawioFrame"></iframe>
  </div>

  <div id="view3d">
    <div id="view3dBar">
      <button id="backTo2dBtn">Back to editor</button>
      <span>Drag to orbit, scroll to zoom</span>
    </div>
    <div id="view3dCanvas"></div>
  </div>

  <div class="overlay" id="pasteOverlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Paste diagram XML</h2>
        <button id="closePasteBtn" class="close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <p class="desc">Paste the raw mxGraph XML another LLM gave you (starting with &lt;mxfile&gt;). It'll load straight onto the canvas, fully editable.</p>
      <textarea id="pasteArea" placeholder="&lt;mxfile&gt;...&lt;/mxfile&gt;"></textarea>
      <div class="modal-actions">
        <button id="cancelPasteBtn">Cancel</button>
        <button id="loadPastedBtn" class="primary">Load into canvas</button>
      </div>
    </div>
  </div>

  <div class="overlay" id="helpOverlay">
    <div class="modal">
      <div class="modal-header">
        <h2>How to use this?</h2>
        <button id="closeHelpBtn" class="close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <p class="desc">AI Diagram is a bridge between the real drawio editor and whatever LLM chat you already use - it doesn't call any AI itself.</p>
      <ol class="steps">
        <li><span class="num">1</span><span><b>Copy Guideline</b> and paste it into ChatGPT, Claude, Gemini, etc., along with your diagram idea.</span></li>
        <li><span class="num">2</span><span><b>Paste XML</b> with the raw XML that chat gives you back - it loads straight onto the canvas, fully editable.</span></li>
        <li><span class="num">3</span><span><b>Copy XML</b> any time to hand the current diagram back to that chat for a change, then <b>Paste XML</b> again to load the update.</span></li>
        <li><span class="num">4</span><span><b>Export PNG</b> when you're happy with it. <span class="sub">The sun/moon icon switches light/dark mode.</span></span></li>
      </ol>
      <div class="modal-actions">
        <button id="gotItBtn" class="primary">Got it</button>
      </div>
    </div>
  </div>

  <div id="toasts"></div>

  <script>
    const frame = document.getElementById('drawioFrame');
    const frameWrap = document.getElementById('frameWrap');
    const copyXmlBtn = document.getElementById('copyXmlBtn');
    const copyGuidelineBtn = document.getElementById('copyGuidelineBtn');
    const pasteXmlBtn = document.getElementById('pasteXmlBtn');
    const exportBtn = document.getElementById('exportBtn');
    const view3dBtn = document.getElementById('view3dBtn');
    const view3d = document.getElementById('view3d');
    const view3dCanvas = document.getElementById('view3dCanvas');
    const backTo2dBtn = document.getElementById('backTo2dBtn');
    const pasteOverlay = document.getElementById('pasteOverlay');
    const pasteArea = document.getElementById('pasteArea');
    const loadPastedBtn = document.getElementById('loadPastedBtn');
    const cancelPasteBtn = document.getElementById('cancelPasteBtn');
    const toastsEl = document.getElementById('toasts');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpOverlay = document.getElementById('helpOverlay');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const gotItBtn = document.getElementById('gotItBtn');
    const closePasteBtn = document.getElementById('closePasteBtn');

    // The toggle flips *both* our own chrome (modal/toasts, via data-theme)
    // and the real drawio editor's own dark mode (canvas/panels), which can
    // only be set at load time - so switching it means reloading the iframe
    // with a new ?dark= param and restoring whatever was on the canvas.
    let isDark = document.documentElement.dataset.theme === 'dark';
    let bootXml = '';

    const EDITOR_PATH = ${JSON.stringify(editorPath)};
    const GUIDELINE = ${JSON.stringify(COPY_GUIDELINE)};

    function editorSrc(dark) {
      return EDITOR_PATH + '?embed=1&proto=json&spin=1&noSaveBtn=1&noExitBtn=1&ui=min&dark=' + (dark ? '1' : '0');
    }

    themeToggleBtn.addEventListener('click', async () => {
      withSpinner(themeToggleBtn, true);
      try {
        let xml = '';
        try { xml = await getCurrentXml(); } catch { /* nothing loaded yet, boot blank */ }

        isDark = !isDark;
        const next = isDark ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('ai-diagram-theme', next);

        bootXml = xml;
        pending.clear();
        frame.src = editorSrc(isDark);
        await waitFor('load', 20000);
        toast('Switched to ' + next + ' mode.', 'success');
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      } finally {
        withSpinner(themeToggleBtn, false);
      }
    });

    let pending = new Map(); // event -> resolve

    function toast(message, kind) {
      const el = document.createElement('div');
      el.className = 'toast' + (kind ? ' ' + kind : '');
      el.innerHTML = '<span class="dot"></span><span></span>';
      el.querySelector('span:last-child').textContent = message;
      toastsEl.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }

    function withSpinner(btn, busy) {
      if (busy) {
        btn.dataset.label = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span>' + btn.textContent.trim();
      } else if (btn.dataset.label) {
        btn.innerHTML = btn.dataset.label;
      }
      btn.disabled = busy;
    }

    window.addEventListener('message', (e) => {
      if (typeof e.data !== 'string') return;
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.event === 'init') {
        hideEmbeddedBranding();
        post({ action: 'load', xml: bootXml, autosave: 1 });
        return;
      }
      if (msg.event === 'dialog') {
        toast('drawio: ' + (msg.message || 'error'), 'error');
        return;
      }
      const resolve = pending.get(msg.event);
      if (resolve) {
        pending.delete(msg.event);
        resolve(msg);
      }
    });

    function post(message) {
      frame.contentWindow.postMessage(JSON.stringify(message), '*');
    }

    // The embedded editor is drawio's own stock UI, which ships a small
    // GitHub-logo link to its own repo. Same-origin (we serve it ourselves),
    // so we can hide just that one element without touching drawio's source.
    function hideEmbeddedBranding() {
      try {
        const doc = frame.contentDocument;
        const style = doc.createElement('style');
        style.textContent = 'a[href="https://github.com/jgraph/drawio"] { display: none !important; }';
        doc.head.appendChild(style);
      } catch {
        // ignore if the iframe document isn't reachable for any reason
      }
    }

    function waitFor(event, timeoutMs) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(event);
          reject(new Error('Timed out waiting for ' + event));
        }, timeoutMs || 15000);
        pending.set(event, (msg) => { clearTimeout(timer); resolve(msg); });
      });
    }

    async function getCurrentXml() {
      post({ action: 'export', format: 'xml' });
      const msg = await waitFor('export', 15000);
      return msg.xml;
    }

    async function loadXml(xml) {
      post({ action: 'load', xml, autosave: 1 });
      await waitFor('load', 15000);
    }

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) console.log('AI Diagram clipboard fallback:\\n' + text);
        return ok;
      }
    }

    copyXmlBtn.addEventListener('click', async () => {
      withSpinner(copyXmlBtn, true);
      try {
        const xml = await getCurrentXml();
        const ok = await copyText(xml);
        toast(ok ? 'Diagram XML copied to clipboard.' : 'Could not copy automatically - check console.', ok ? 'success' : 'error');
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      } finally {
        withSpinner(copyXmlBtn, false);
      }
    });

    copyGuidelineBtn.addEventListener('click', async () => {
      withSpinner(copyGuidelineBtn, true);
      try {
        const ok = await copyText(GUIDELINE);
        toast(ok ? 'Guideline copied to clipboard.' : 'Could not copy automatically - check console.', ok ? 'success' : 'error');
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      } finally {
        withSpinner(copyGuidelineBtn, false);
      }
    });

    function openPasteModal() {
      pasteOverlay.classList.add('open');
      pasteArea.value = '';
      pasteArea.focus();
    }
    function closePasteModal() {
      pasteOverlay.classList.remove('open');
    }

    pasteXmlBtn.addEventListener('click', openPasteModal);
    cancelPasteBtn.addEventListener('click', closePasteModal);
    closePasteBtn.addEventListener('click', closePasteModal);
    pasteOverlay.addEventListener('click', (e) => { if (e.target === pasteOverlay) closePasteModal(); });

    function openHelp() {
      helpOverlay.classList.add('open');
    }
    function closeHelp() {
      helpOverlay.classList.remove('open');
    }

    helpBtn.addEventListener('click', openHelp);
    closeHelpBtn.addEventListener('click', closeHelp);
    gotItBtn.addEventListener('click', closeHelp);
    helpOverlay.addEventListener('click', (e) => { if (e.target === helpOverlay) closeHelp(); });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closePasteModal();
      closeHelp();
    });

    // Show the help overlay automatically the first time someone visits.
    if (!localStorage.getItem('ai-diagram-help-seen')) {
      localStorage.setItem('ai-diagram-help-seen', '1');
      openHelp();
    }

    loadPastedBtn.addEventListener('click', async () => {
      const xml = pasteArea.value.trim();
      if (!xml) return;
      withSpinner(loadPastedBtn, true);
      try {
        await loadXml(xml);
        closePasteModal();
        toast('Diagram loaded.', 'success');
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      } finally {
        withSpinner(loadPastedBtn, false);
      }
    });

    exportBtn.addEventListener('click', async () => {
      withSpinner(exportBtn, true);
      try {
        post({ action: 'export', format: 'png' });
        const msg = await waitFor('export', 15000);
        const a = document.createElement('a');
        a.href = msg.data;
        a.download = 'diagram.png';
        a.click();
        toast('PNG exported.', 'success');
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      } finally {
        withSpinner(exportBtn, false);
      }
    });

    // --- 3D View -----------------------------------------------------
    // Purely a visualization layer on top of the same mxGraph XML - it
    // doesn't introduce a new diagram format, so Copy/Paste XML and any
    // LLM chat's output are unaffected. Three.js is loaded lazily (only
    // once "3D View" is clicked) from a CDN, so it costs nothing otherwise.

    function parseDiagramForThree(xmlText) {
      const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
      const nodes = [];
      const edges = [];
      for (const cell of doc.querySelectorAll('mxCell')) {
        if (cell.getAttribute('vertex') === '1') {
          const geo = cell.querySelector('mxGeometry');
          if (!geo) continue;
          const style = cell.getAttribute('style') || '';
          const fillMatch = style.match(/fillColor=(#[0-9a-fA-F]{6})/);
          nodes.push({
            id: cell.getAttribute('id'),
            label: cell.getAttribute('value') || '',
            x: parseFloat(geo.getAttribute('x') || '0'),
            y: parseFloat(geo.getAttribute('y') || '0'),
            w: parseFloat(geo.getAttribute('width') || '80'),
            h: parseFloat(geo.getAttribute('height') || '40'),
            color: fillMatch ? fillMatch[1] : '#6366f1',
          });
        } else if (cell.getAttribute('edge') === '1' && cell.getAttribute('source') && cell.getAttribute('target')) {
          edges.push({ source: cell.getAttribute('source'), target: cell.getAttribute('target') });
        }
      }
      return { nodes, edges };
    }

    const THREE_MODULE_SRC = [
      "import * as THREE from 'three';",
      "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
      "let scene, camera, renderer, controls, group, initialized = false;",
      "function ensureInit(container) {",
      "  if (initialized) return;",
      "  initialized = true;",
      "  scene = new THREE.Scene();",
      "  camera = new THREE.PerspectiveCamera(50, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 10000);",
      "  renderer = new THREE.WebGLRenderer({ antialias: true });",
      "  renderer.setPixelRatio(window.devicePixelRatio);",
      "  renderer.setSize(container.clientWidth, container.clientHeight);",
      "  container.appendChild(renderer.domElement);",
      "  controls = new OrbitControls(camera, renderer.domElement);",
      "  controls.enableDamping = true;",
      "  scene.add(new THREE.AmbientLight(0xffffff, 0.7));",
      "  const dir = new THREE.DirectionalLight(0xffffff, 0.8);",
      "  dir.position.set(300, 500, 300);",
      "  scene.add(dir);",
      "  window.addEventListener('resize', () => {",
      "    if (!container.clientWidth || !container.clientHeight) return;",
      "    camera.aspect = container.clientWidth / container.clientHeight;",
      "    camera.updateProjectionMatrix();",
      "    renderer.setSize(container.clientWidth, container.clientHeight);",
      "  });",
      "  (function animate() {",
      "    requestAnimationFrame(animate);",
      "    controls.update();",
      "    renderer.render(scene, camera);",
      "  })();",
      "}",
      "function makeLabel(text) {",
      "  const canvas = document.createElement('canvas');",
      "  canvas.width = 256; canvas.height = 64;",
      "  const ctx = canvas.getContext('2d');",
      "  ctx.fillStyle = '#ffffff';",
      "  ctx.font = 'bold 26px sans-serif';",
      "  ctx.textAlign = 'center';",
      "  ctx.fillText((text || '').slice(0, 22), 128, 40);",
      "  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }));",
      "  sprite.scale.set(90, 22, 1);",
      "  return sprite;",
      "}",
      "function render(nodes, edges) {",
      "  if (group) scene.remove(group);",
      "  group = new THREE.Group();",
      "  scene.add(group);",
      "  if (nodes.length === 0) return;",
      "  const cx = nodes.reduce((s, n) => s + n.x + n.w / 2, 0) / nodes.length;",
      "  const cy = nodes.reduce((s, n) => s + n.y + n.h / 2, 0) / nodes.length;",
      "  const depth = 30;",
      "  const positions = {};",
      "  for (const n of nodes) {",
      "    const px = n.x + n.w / 2 - cx;",
      "    const pz = n.y + n.h / 2 - cy;",
      "    const mesh = new THREE.Mesh(new THREE.BoxGeometry(n.w, depth, n.h), new THREE.MeshStandardMaterial({ color: n.color }));",
      "    mesh.position.set(px, depth / 2, pz);",
      "    group.add(mesh);",
      "    positions[n.id] = mesh.position;",
      "    const label = makeLabel(n.label);",
      "    label.position.set(px, depth + 22, pz);",
      "    group.add(label);",
      "  }",
      "  for (const e of edges) {",
      "    const a = positions[e.source], b = positions[e.target];",
      "    if (!a || !b) continue;",
      "    const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);",
      "    group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8b91a3 })));",
      "  }",
      "  let maxSpan = 200;",
      "  for (const n of nodes) {",
      "    maxSpan = Math.max(maxSpan, Math.abs(n.x + n.w / 2 - cx) + n.w / 2, Math.abs(n.y + n.h / 2 - cy) + n.h / 2);",
      "  }",
      "  camera.position.set(0, maxSpan * 1.3, maxSpan * 2.1);",
      "  controls.target.set(0, 0, 0);",
      "  camera.lookAt(0, 0, 0);",
      "  controls.update();",
      "}",
      "window.__aiDiagram3D = { ensureInit, render };",
      "window.dispatchEvent(new Event('ai-diagram-3d-ready'));",
    ].join('\\n');

    let three3DPromise = null;
    function load3D() {
      if (!three3DPromise) {
        three3DPromise = new Promise((resolve, reject) => {
          window.addEventListener('ai-diagram-3d-ready', () => resolve(window.__aiDiagram3D), { once: true });
          const s = document.createElement('script');
          s.type = 'module';
          s.textContent = THREE_MODULE_SRC;
          s.onerror = () => reject(new Error('Failed to load 3D view (are you offline?)'));
          document.head.appendChild(s);
        });
      }
      return three3DPromise;
    }

    view3dBtn.addEventListener('click', async () => {
      withSpinner(view3dBtn, true);
      try {
        const xml = await getCurrentXml();
        const { nodes, edges } = parseDiagramForThree(xml);
        if (nodes.length === 0) {
          toast('Nothing to show in 3D yet - add some shapes first.', 'error');
          return;
        }
        const api = await load3D();
        frameWrap.style.display = 'none';
        view3d.classList.add('open');
        api.ensureInit(view3dCanvas);
        api.render(nodes, edges);
      } catch (err) {
        toast('Error: ' + err.message, 'error');
      } finally {
        withSpinner(view3dBtn, false);
      }
    });

    backTo2dBtn.addEventListener('click', () => {
      view3d.classList.remove('open');
      frameWrap.style.display = 'block';
    });

    frame.src = editorSrc(isDark);
  </script>
</body>
</html>
`;
}
