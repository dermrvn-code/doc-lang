@echo on
call npm run langium:generate
call npm run build
@echo Building extension...
cd .\packages\extension\
call vsce package --allow-missing-repository
@echo Installing extension...
call code --install-extension .\vscode-doc-lang-0.0.1.vsix
