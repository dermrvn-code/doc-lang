import MarkdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import mermaid from "mermaid";

import dummyMD from '../../../examples/output/first-example.md?raw';


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

// Render Mermaid code fences as Mermaid divs
const defaultFence = md.renderer.rules.fence;

md.renderer.rules.fence = (
  tokens,
  idx,
  options,
  env,
  self,
) => {
  const token = tokens[idx];

  if (token.info.trim() === "mermaid") {
    return `
<div class="mermaid">
${token.content}
</div>
`;
  }

  return defaultFence
    ? defaultFence(
      tokens,
      idx,
      options,
      env,
      self,
    )
    : self.renderToken(
      tokens,
      idx,
      options,
    );
};

const update = () => {
  void updateMarkdown();
};

const updateMarkdown = async () => {
  const mdelem =
    document.getElementById("markdown-preview");

  if (mdelem == null) {
    return;
  }

  const code = getCurrentCode();

  // TODO: Replace with generated Markdown from DSL
  const finalMD = dummyMD;

  mdelem.innerHTML = md.render(finalMD);

  await mermaid.run({
    nodes: Array.from(
      mdelem.querySelectorAll(".mermaid"),
    ),
  });
};

export const runDsl = async () => {
  try {
    await startMonacoEditor(
      document.getElementById(
        "monaco-editor-root",
      )!,
    );

    document
      .getElementById("button-update")
      ?.addEventListener("click", update);

    await updateMarkdown();
  } catch (e) {
    console.error(e);
  }
};
