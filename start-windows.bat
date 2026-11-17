@echo off
title HR-RaceMaster Starter (Windows)
cd /d "%~dp0"

echo ========================================================
echo   HR-RaceMaster - 1-Klick Installer ^& Starter (Windows)
echo ========================================================

REM 1. Pruefen ob node_modules und autoprefixer vorhanden sind
if not exist "node_modules\autoprefixer" (
    echo [1/3] Installiere benoetigte Pakete ^(einmalig, bitte warten^)...
    call npm install
)

REM 2. Optional KaRaS Python Bridge starten (falls Python installiert ist)
where python >nul 2>nul
if %errorlevel%==0 (
    echo [2/3] Starte KaRaS Live-Bridge im Hintergrund ^(Port 8080^)...
    start /b "" python scripts\karas_bridge.py --dir C:\KaRaS
)

REM 3. Browser nach 4 Sekunden automatisch oeffnen
echo [3/3] Starte HR-RaceMaster Server auf http://localhost:3000 ...
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000"

call npm run dev
pause
