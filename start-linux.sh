#!/bin/bash
if [ ! -t 1 ]; then
    if command -v gnome-terminal >/dev/null 2>&1; then
        exec gnome-terminal --title="HR-RaceMaster Live-Konsole" -- "$0"
    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        exec x-terminal-emulator -e "$0"
    fi
fi

cd "$(dirname "$0")"

echo "========================================================"
echo "  🏁 HR-RaceMaster Live-Konsole (Linux Mint)"
echo "========================================================"

pkill -9 -f "next" 2>/dev/null || true
pkill -f "karas_bridge.py" 2>/dev/null || true
sleep 0.5

if ! command -v npm &> /dev/null; then
    sudo apt update && sudo apt install -y nodejs npm python3
fi

if [ ! -d "node_modules" ] || [ ! -d "node_modules/autoprefixer" ]; then
    npm install
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo "🔨 Erstelle Produktions-Build (bitte kurz warten)..."
    npm run build
fi

echo "⚡ Starte KaRaS Live-Bridge v31 (Port 8080)..."
nohup python3 -u scripts/karas_bridge.py > /tmp/karas_bridge.log 2>&1 &

echo "🌐 Starte HR-RaceMaster Webserver (Port 3000)..."
nohup npm start > /tmp/racemaster_web.log 2>&1 &

LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "--------------------------------------------------------"
echo "✅ Lokal am PC:          http://localhost:3000"
echo "📱 Smartphone Check-In:  http://${LOCAL_IP}:3000/mobile"
echo "📺 Für WLAN-Tablets/TV:  http://${LOCAL_IP}:3000"
echo "--------------------------------------------------------"
echo "📡 LIVE-TRANSPONDER-KONSOLE (Strg+C beendet die Ansicht):"
echo ""

(sleep 3 && xdg-open "http://localhost:3000" >/dev/null 2>&1 || true) &
sleep 1
tail -f /tmp/karas_bridge.log
