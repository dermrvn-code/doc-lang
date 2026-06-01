import MarkdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import mermaid from "mermaid";

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

const dummyMD = `
# Wiki Page for "Example Project"

Here will be the documentation for the "Example Project".

## Table of Contents

- [Diagrams](#00)
  - [Class Diagram](#00-01)
  - [Dependency Diagram](#00-02)
- [Example Section](#01)

---

## Diagrams {#00}

### Class Diagram {#00-01}

\`\`\`mermaid
classDiagram
direction LR

class Backend {
  +Logger logger
}

class Logger {
  +string name
  +int id = 0
  +Func Log
}

class Log {
  +void Log(string message)
}

Backend --> Logger : contains
Logger --> Log : uses
\`\`\`

## Dependency Diagram {#00-02}

\`\`\`mermaid
graph LR

Backend["Backend"]
Logger["Logger"]
Log["Log Function"]

Backend -->|"depends on"| Logger
Logger -->|"depends on"| Log
\`\`\`

---

## Example Section {#01}

- [Objects](#01-01)
   - [Logger](#01-01-01)
   - [Backend](#01-01-02)
- [Functions](#01-02)
   - [Log](#01-02-01)

---

### Objects {#01-01}

#### \`Logger\` {#01-01-01}

Core logging component of the system.

**Fields**

- **name**: \`string\`
- **id**: \`int\` = 0
- **Log**: \`Func\` = [\`Log\`](#01-02-01)

**Usage**
\`\`\`
Logger logger = new Logger();
\`\`\`

**See also**
[\`Log\`](#01-02-01) [\`Backend\`](#01-01-02)

---

#### \`Backend\` {#01-01-02}

Main backend container object.

**Fields**

- **logger**: [\`Logger\`](#01-01-01) = new Logger()

**Usage**
\`\`\`
Backend backend = new Backend();
backend.logger.log("This is a log message.");
\`\`\`

**See also**
[\`Logger\`](#01-01-01)

---
### Functions {#01-02}

#### \`Log\` {#01-02-01}

Handles logging of messages.

**Parameters**
- **message**: \`string\`

**Returns**: \`void\`

**Usage**
\`\`\`
logger.Log("This is a log message.");
\`\`\`

**See also**
[\`Logger\`](#01-01-01)
`;
