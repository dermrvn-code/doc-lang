# Doc-Lang Project

## Quick Start

This project provides batch scripts to build and run the application.

### Build Script

Run `build.bat` to compile the project:
```bash
build.bat
```
This script compiles all TypeScript source code, generates and installs the VS Code extension.

After reloading the VS Code window, the new LSP server will be available for use. You can test it by opening a file with the appropriate language and checking for LSP features like diagnostics, code completion, etc.

### Run Script

Run `run.bat` to start dlang file compilation and execution:
```bash
run.bat <doc-lang-file.dlang>
```

> ! This does not do anything currently, as compilation and execution logic is not implemented yet. !
