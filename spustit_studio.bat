@echo off
title AI Studio - YouTube Automatizace
cd /d "%~dp0"

echo ===================================================
echo     Spoustim AI YouTube Studio...
echo ===================================================
echo.

:: Otevrit prohlizec Google Chrome na adrese studia
start http://localhost:3000

:: Spustit lokalni aplikaci (bezi jen dokud nezavrete toto cerne okno)
npm run dev
