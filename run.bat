@echo off

REM Check if parameter is provided
if "%~1"=="" (
    echo Usage: run.bat path\to\file.dlang
    exit /b 1
)

REM Input file
set INPUT=%~1

REM Extract filename without extension
set NAME=%~n1

REM Remove hyphens from filename
set CLEAN_NAME=%NAME:-=%

REM Generate JS from dlang
node .\packages\cli\bin\cli generate "%INPUT%"

REM Run generated file
node .\generated\%CLEAN_NAME%.js