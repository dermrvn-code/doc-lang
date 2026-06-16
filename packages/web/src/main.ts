import MarkdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import mermaid from "mermaid";

import { dlangStringToMarkdown } from "doc-lang-cli";

import {
  startMonacoEditor,
  getCurrentCode,
} from "./dsleditor/maindsl.js";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

md.use(markdownItAttrs);

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
});

// -----------------------------
// STATE
// -----------------------------

let isUpdating = false;

// -----------------------------
// STATUS
// -----------------------------

function setStatus(
  state: "ready" | "loading" | "error",
  text: string
): void {
  const el = document.getElementById("generation-status");

  if (!el) return;

  el.className = `status ${state}`;
  el.textContent = text;
}

// -----------------------------
// OVERLAY CONTROL
// -----------------------------

function setPreviewState(
  state: "idle" | "loading" | "error"
): void {
  const panel = document.querySelector(".preview-panel");
  const overlay = document.getElementById("preview-overlay");
  const loading = document.getElementById("overlay-loading");
  const error = document.getElementById("overlay-error");

  if (!panel || !overlay || !loading || !error) return;

  if (state === "idle") {
    overlay.classList.add("hidden");
    panel.classList.remove("blurred");
    return;
  }

  overlay.classList.remove("hidden");
  panel.classList.add("blurred");

  if (state === "loading") {
    loading.classList.remove("hidden");
    error.classList.add("hidden");
  }

  if (state === "error") {
    loading.classList.add("hidden");
    error.classList.remove("hidden");
  }
}

// -----------------------------
// CONSOLE OUTPUT
// -----------------------------

function appendConsole(message: string): void {
  const output = document.getElementById("console-output");

  if (!output) return;

  output.textContent +=
    `[${new Date().toLocaleTimeString()}] ${message}\n`;

  const panel =
    document.getElementById("console-panel") as HTMLDetailsElement | null;

  panel?.setAttribute("open", "");
}

function clearConsole(): void {
  const output = document.getElementById("console-output");

  if (output) {
    output.textContent = "";
  }

  const panel =
    document.getElementById("console-panel") as HTMLDetailsElement | null;

  if (panel) {
    panel.removeAttribute("open");
  }
}
// -----------------------------
// UPDATE PIPELINE
// -----------------------------

const updateMarkdown = async () => {
  const mdelem = document.getElementById("markdown-preview");

  if (!mdelem || isUpdating) return;

  isUpdating = true;

  try {
    setStatus("loading", "Generating...");
    setPreviewState("loading");

    const code = getCurrentCode();

    const finalMD = await dlangStringToMarkdown(code);

    mdelem.innerHTML = md.render(finalMD);

    await mermaid.run({
      nodes: Array.from(
        mdelem.querySelectorAll(".language-mermaid")
      ),
    });

    clearConsole();

    setPreviewState("idle");
    setStatus("ready", "Ready");

  } catch (error) {
    const message =
      error instanceof Error
        ? `${error.message}\n\n${error.stack ?? ""}`
        : String(error);

    console.error(error);
    appendConsole(message);

    setPreviewState("error");
    setStatus("error", "Generation Failed");
  } finally {
    isUpdating = false;
  }
};

// -----------------------------
// EVENTS
// -----------------------------

const update = () => {
  void updateMarkdown();
};

const handleKeyDown = (e: KeyboardEvent) => {
  const isSave =
    (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";

  if (!isSave) return;

  e.preventDefault();
  update();
};

// -----------------------------
// APP ENTRY
// -----------------------------x

export const runDsl = async () => {
  try {
    await startMonacoEditor(
      document.getElementById("monaco-editor-root")!
    );

    document
      .getElementById("button-update")
      ?.addEventListener("click", update);

    window.addEventListener("keydown", handleKeyDown, true);

    await updateMarkdown();

    setStatus("ready", "Ready");
  } catch (e) {
    console.error(e);
    appendConsole(
      e instanceof Error ? e.stack ?? e.message : String(e)
    );

    setStatus("error", "Startup Error");
  }
};
