# Doc-Lang Project

## Quick Start

This project provides a DSL toolchain for parsing, validating, and generating outputs from ```.dlang``` files.

It includes:
- Langium-based language implementation
- CLI tool (```doc-lang```)
- VS Code extension (LSP support)

## Web Editor - DocLang Studio

Start the web editor from the workspace root with:

```bash
npm run dev
```

This forwards to the web package and starts the Vite dev server for the browser-based editor.

It normally opens at [http://localhost:20002/](http://localhost:20002/).

**Usage**:

Enter your code in the editor on the left, then render it with `Ctrl+S` or by clicking `Render`.

The console and error log can be toggled at the bottom of the page.

![Web Editor](./docs/webinterface_screenshot.png)
---

# Build

To build the project, follow these steps:

**Step 1: Generate Langium artifacts**

```bash
npm run langium:generate
```

**Step 2: Compile TypeScript and build packages**

```bash
npm run build
```

**Step 3: Package the VS Code extension**

```bash
cd packages/extension
vsce package --allow-missing-repository
```

**Step 4: Install the VS Code extension**

```bash
code --install-extension ./vscode-doc-lang-0.0.1.vsix
```


---

# VS Code Extension

After building:

1. Reload VS Code window
2. Open a ```.dlang``` file
3. LSP features will be available:
   - diagnostics
   - references
   - completion (if implemented)

---

# CLI Usage

The CLI allows you to process ```.dlang``` files from the terminal.

## 1. Install CLI globally (recommended for development)

From the project root:

```bash
cd packages/cli
npm link
```

This registers the CLI globally as:

```bash
doc-lang
```

### Example usage:

```bash
doc-lang generate examples/first-example.dlang
```

---

## 2. Remove CLI link (if needed)

```bash
cd packages/cli
npm unlink -g
```

---

## 3. Direct usage without linking (no install required)

You can also run the CLI directly via Node:

```bash
node packages/cli/bin/cli.js generate examples/first-example.dlang
```

This is useful for:
- debugging
- CI environments
- verifying build output

---

## 4. Build required before CLI usage

If you use either method above, ensure the project is built first:

```bash
npm run build
```
