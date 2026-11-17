#!/bin/bash
# ============================================================================
# HR-RaceMaster - 1-Klick Installer & Starter für Linux Mint / Ubuntu
# ============================================================================
set -e
cd "$(dirname "$0")"

echo "========================================================"
echo "  🏁 HR-RaceMaster Starter (Linux Mint)"
echo "========================================================"

# 1. Prüfen ob Node.js / npm installiert ist
if ! command -v npm &> /dev/null; then
    echo "⚙️ Node.js & npm werden installiert..."
    sudo apt update && sudo apt install -y nodejs npm python3
fi

# 2. Prüfen ob Pakete (inkl. autoprefixer) installiert sind
if [ ! -d "node_modules" ] || [ ! -d "node_modules/autoprefixer" ]; then
    echo "📦 Installiere benötigte Pakete (einmalig)..."
    npm install
fi

# 3. KaRaS Live-Bridge im Hintergrund starten (falls noch nicht aktiv)
if ! pgrep -f "karas_bridge.py" > /dev/null; then
    echo "⚡ Starte KaRaS Live-Bridge auf Port 8080..."
    nohup python3 scripts/karas_bridge.py > /tmp/karas_bridge.log 2>&1 &
fi

# 4. Lokale IP-Adresse für WLAN-Tablets anzeigen
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "--------------------------------------------------------"
echo "✅ Lokal am PC:         http://localhost:3000"
echo "📱 Für WLAN-Tablets:    http://${LOCAL_IP}:3000"
echo "--------------------------------------------------------"

# Browser verzögert öffnen
(sleep 3 && xdg-open "http://localhost:3000" >/dev/null 2>&1 || true) &

# 5. Next.js Server starten
npm run dev
