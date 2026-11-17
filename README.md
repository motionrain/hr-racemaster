# HR-RaceMaster

**Modulares Event-, Gruppen- & KartRolling-Managementsystem mit KaRaS-Echtzeitanbindung**  
Entwickelt für den professionellen Kartbahn-Betrieb unter **Linux Mint (Wine)** und **Windows**.

---

## Überblick & Funktionen

**HR-RaceMaster** digitalisiert und automatisiert die Durchführung großer Gruppen-Events (20 bis 40+ Fahrer) im Bahnbetrieb:

* **2 Haupt-Rennformate:**
  1. **GP Rennen:** Optionales Warm-up $\rightarrow$ 1 bis 4 Qualifikationsläufe $\rightarrow$ Finalläufe (A-, B-, C-Finale).
  2. **KartRolling (Jeder fährt mit jedem Kart):** Optionales Warm-up $\rightarrow$ Vollautomatische Kart-Rotation nach dem Prinzip des Lateinischen Quadrats. Auch kleinere Gruppen (z. B. 6er-Gruppe bei einer `7 / 7 / 6`-Aufteilung) fahren alle Läufe, damit jeder Fahrer auf exakt dieselbe Anzahl gewerteter Fahrten kommt.
* **Flotten- & Defekt-Management:**
  * Umschaltbar zwischen **Erwachsenen-Flotte (Kart 1–14)** und **Kinderkarts (Kids 1–8)**.
  * Defekte Karts oder gesperrte Startnummern (z. B. *Kart 13*) lassen sich per Klick deaktivieren und werden automatisch in allen Berechnungen übersprungen.
  * Streckenlimit flexibel wählbar (**Max. 8 Karts** oder **Max. 10 Karts** gleichzeitig auf der Bahn).
* **Karten-basiertes Live-Cockpit (KaRaS Start / Stopp Workflow):**
  * Jeder Lauf wird als übersichtliche Status-Karte dargestellt (*Wartet auf KaRaS Start* $\rightarrow$ *Läuft live* $\rightarrow$ *KaRaS Stopp erkannt*).
  * **Live-Sortierung:** Im Warm-up und Qualifying sortiert sich die Tabelle live nach der **schnellsten Runde (Bestzeit)**; im Finale live nach der **höchsten Rundenanzahl**.
  * **Flexible Kart-Zuweisung:** Karts können pro Lauf manuell per Dropdown getauscht, in **Zahlenfolge (1, 2, 3...)** vergeben oder **per Zufall ausgelost** werden.
  * Nach jedem Lauf steht sofort ein **1-Klick-Ausdruck (DIN A4)** bereit, bevor mit **„NEXT / WEITER“** die nächste Karte geladen wird.
* **DIN-A4 Motorsport-Ausdrucke:**
  * Aktueller Einzellauf, Qualifying-Gesamtwertung, KartRolling-Boxengassenplan, Final-Endergebnisse und offizielle **Sieger-Urkunde**.
* **Star Dust Theme:**
  * Umschaltbar zwischen *Star Dust Light* und *Star Dust Dark* für optimale Lesbarkeit an der Theke und auf Tablets in der Boxengasse.

---

## Projektstruktur

```text
hr-racemaster/
├── scripts/
│   ├── karas_bridge.py                 # Python Echtzeit-Bridge für KaRaS RE*.dat (Port 8080)
│   └── hr-racemaster-bridge.service    # Systemd-Autostart-Service für Linux Mint
├── src/
│   ├── types/
│   │   └── kart.ts                     # TypeScript-Interfaces & Datenmodelle
│   ├── lib/
│   │   └── raceLogic.ts                # Berechnungslogik (Gruppen, KartRolling, Finale)
│   ├── hooks/
│   │   └── useKarasBridge.ts           # React-Hook für KaRaS-Polling & Simulator
│   ├── components/
│   │   ├── Header.tsx                  # Kopfzeile & Star-Dust-Theme-Schalter
│   │   ├── StepSetup.tsx               # Modul 1: Event-Art & Kart-Selektion
│   │   ├── StepLiveCards.tsx           # Modul 2: Live-Karten-Cockpit (Start/Stopp/Next)
│   │   ├── StepFinals.tsx              # Modul 3: Finalläufe (Rundenanzahl-Wertung)
│   │   └── StepPrintA4.tsx             # Modul 4: DIN-A4 Druckansichten & Urkunde
│   └── app/
│       └── page.tsx                    # Haupt-Applikation
├── package.json
└── README.md
```

---

## Voraussetzungen

* **Node.js** (Version 18 LTS oder 20 LTS empfohlen)
* **Python 3** (ab Version 3.8, standardmäßig auf Linux Mint vorinstalliert – benötigt **keine** zusätzlichen `pip`-Pakete)
* **Git** (zum Klonen des Repositories)

---

## Installation unter Linux Mint (Hauptsystem mit KaRaS / Wine)

### 1. System vorbereiten & Node.js installieren
Öffne das Terminal (`Strg` + `Alt` + `T`) und führe folgende Befehle aus:

```bash
sudo apt update
sudo apt install -y curl git python3

# Node.js 20 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Versionen prüfen
node -v
npm -v
```

### 2. Repository klonen & Abhängigkeiten installieren

```bash
cd /home/kart
git clone https://github.com/DEIN-BENUTZERNAME/hr-racemaster.git
cd hr-racemaster

# Pakete installieren
npm install
```

### 3. Produktions-Build erstellen & testen

```bash
npm run build
npm start
```

Die Anwendung ist nun im Browser unter **`http://localhost:3000`** erreichbar. (Zum Beenden im Terminal `Strg` + `C` drücken).

---

## KaRaS Live-Bridge einrichten (Linux Mint)

Die Datei `scripts/karas_bridge.py` überwacht das KaRaS-Verzeichnis (`/home/kart/.wine32/drive_c/KaRaS`), liest neue `RE*.dat`-Tagesdateien in Echtzeit aus und stellt die Transponder-Zeiten sowie den Start-/Stopp-Status auf **`http://localhost:8080/status`** bereit.

### 1. Diagnose-Test der bestehenden `RE*.dat` Datei
Um zu prüfen, ob die KaRaS-Dateien gefunden und gelesen werden:

```bash
cd /home/kart/hr-racemaster
npm run bridge:inspect
```

### 2. Bridge manuell im Terminal testen

```bash
npm run bridge
```

---

## Autostart & Desktop-Symbol unter Linux Mint einrichten

Damit deine Mitarbeiter keine Terminal-Befehle eingeben müssen, werden sowohl die **KaRaS-Bridge** als auch die **HR-RaceMaster Web-App** als automatische Hintergrunddienste (`systemd`) eingerichtet.

### 1. KaRaS-Bridge als Hintergrunddienst aktivieren

```bash
sudo cp /home/kart/hr-racemaster/scripts/hr-racemaster-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hr-racemaster-bridge.service
sudo systemctl start hr-racemaster-bridge.service
```

### 2. HR-RaceMaster Web-App als Hintergrunddienst aktivieren

```bash
sudo bash -c 'cat << EOF > /etc/systemd/system/hr-racemaster-web.service
[Unit]
Description=HR-RaceMaster Next.js Web Service (Port 3000)
After=network.target

[Service]
Type=simple
User=kart
WorkingDirectory=/home/kart/hr-racemaster
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable hr-racemaster-web.service
sudo systemctl start hr-racemaster-web.service
```

### 3. Starter-Icon auf dem Schreibtisch anlegen

```bash
cat << 'EOF' > /home/kart/Schreibtisch/HR-RaceMaster.desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=HR-RaceMaster
Comment=Rennleitung, KartRolling & Auswertung
Exec=xdg-open http://localhost:3000
Icon=applications-games
Terminal=false
Categories=Application;
EOF

chmod +x /home/kart/Schreibtisch/HR-RaceMaster.desktop
```

---

## Installation unter Windows (10 / 11)

1. **Node.js & Python installieren:**
   * Lade **Node.js (LTS)** von [nodejs.org](https://nodejs.org/) herunter und installiere es.
   * Lade **Python 3** von [python.org](https://www.python.org/) herunter (wichtig: beim Setup das Häkchen bei **„Add Python to PATH“** setzen).
2. **Projekt herunterladen & installieren:**
   Öffne die **PowerShell** oder Eingabeaufforderung (`cmd`):
   ```powershell
   git clone https://github.com/DEIN-BENUTZERNAME/hr-racemaster.git
   cd hr-racemaster
   npm install
   ```
3. **Entwicklungsserver starten:**
   ```powershell
   npm run dev
   ```
   Öffne im Browser **`http://localhost:3000`**.
4. **KaRaS-Bridge unter Windows starten (optional):**
   Öffne ein zweites PowerShell-Fenster im Projektordner und gib den Pfad zu deinem KaRaS-Ordner an (Standard `C:\KaRaS`):
   ```powershell
   npm run bridge:win
   ```

---

## Nutzung mit WLAN-Tablets in der Boxengasse

Da **HR-RaceMaster** auf Port `3000` im lokalen Netzwerk läuft, können Einweiser in der Boxengasse mit jedem **Tablet oder Smartphone (iPad / Android)** ohne Internetverbindung direkt auf das System zugreifen:

1. Lokale IP-Adresse des Hauptrechners ermitteln:
   * **Linux Mint:** `hostname -I` (z. B. `192.168.178.45`)
   * **Windows:** `ipconfig` (IPv4-Adresse)
2. Auf dem Tablet im Browser öffnen:
   ```text
   http://192.168.178.45:3000
   ```

---

## Nützliche Befehle für Wartung & Updates

| Aktion | Befehl |
| :--- | :--- |
| **Status der Web-App prüfen (Linux)** | `systemctl status hr-racemaster-web.service` |
| **Status der KaRaS-Bridge prüfen (Linux)** | `systemctl status hr-racemaster-bridge.service` |
| **Nach Code-Änderungen neu bauen** | `npm run build && sudo systemctl restart hr-racemaster-web.service` |
| **Letzte KaRaS-Binärdatei prüfen** | `npm run bridge:inspect` |

---

## Lizenz & Urheberrecht

**© Copyright Hans Richter** – Alle Rechte vorbehalten.  
Konzipiert für den Einsatz im Kartsport- und Eventbetrieb.
