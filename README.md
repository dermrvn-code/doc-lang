# Doc-Lang Project

## Quick Start

This project provides a DSL toolchain for parsing, validating, and generating outputs from ```.dlang``` files.

It includes:
- Langium-based language implementation
- CLI tool (```doc-lang```)
- VS Code extension (LSP support)

---

# Build

Run `build.bat` to compile the project:

```bash
build.bat
```
This script compiles all TypeScript source code, generates and installs the VS Code extension.

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

### Current status:

> This script is a placeholder.  
> Full compilation/execution pipeline is not implemented yet.

