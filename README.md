# HR-RaceMaster © Copyright Hans Richter

**Modulares Event-, Gruppen- & KartRolling-Managementsystem mit KaRaS-Echtzeitanbindung & Smartphone Check-In**

Entwickelt für den professionellen Kartbahn-Betrieb unter **Linux Mint (Wine)** und **Windows**.

---

## Überblick & Kernfunktionen

**HR-RaceMaster** digitalisiert und automatisiert die Durchführung großer Gruppen-Events (20 bis 40+ Fahrer) im Bahnbetrieb komplett lokal im eigenen Netzwerk (ohne Cloud-Zwang):

### 1. Zwei Haupt-Rennformate
* **GP Rennen (Grand Prix):** Optionales Warm-up $\rightarrow$ 1 bis 5 Qualifikationsläufe $\rightarrow$ Finalläufe (Gruppe C $\rightarrow$ Gruppe B $\rightarrow$ Gruppe A).
* **KartRolling (Jeder fährt mit jedem Kart):** Optionales Warm-up $\rightarrow$ Vollautomatische Kart-Rotation nach dem Prinzip des Lateinischen Quadrats. Auch kleinere Gruppen (z. B. 6er-Gruppe bei einer `7 / 7 / 6`-Aufteilung) fahren alle Läufe, damit jeder Fahrer auf exakt dieselbe Anzahl gewerteter Fahrten kommt.

### 2. Flotten-Management & freie Streckenbelegung
* **Flotten-Umschalter:** Wechsel per Klick zwischen **Erwachsenen-Flotte (Kart 1–14)** und **Kinderkarts (Kids 1–8)**.
* **Defekt- & Sperr-Logik:** Defekte Karts oder gesperrte Startnummern (z. B. *Kart 13* bei Aberglaube) werden per Klick deaktiviert und in allen Gruppen- und Rotationsberechnungen automatisch übersprungen.
* **Frei wählbare Streckenbelegung:** Die maximale Kartanzahl pro Gruppe lässt sich frei zwischen `1` und `25` einstellen (inkl. `-` / `+` Tasten und Schnellwahl für `Max. 6`, `7`, `8`, `9`, `10`, `12` oder `Alle Aktiven`).

### 3. Smartphone Fahrer-Erfassung über WLAN (`/mobile`)
* **Mobiles Check-In-Modul:** Über die eigene Route **`http://<IP-DES-PC>:3000/mobile`** können Mitarbeiter oder Gäste Fahrernamen direkt am Smartphone eingeben, Tippfehler korrigieren, einzelne Fahrer löschen oder ganze Listen einfügen.
* **Echtzeit-Synchronisation:** Jeder am Smartphone erfasste Name wird über die lokale API (`/api/event`) innerhalb von 1,5 Sekunden live an den Haupt-PC übertragen und dort sofort in die Gruppeneinteilung übernommen.

### 4. Gruppen- & Rotations-Matrix (Live-Screen & A4-Aushang)
* **Gesamtansicht aller Gruppen:** Zeigt für jede Gruppe (`Gruppe A`, `Gruppe B`, `Gruppe C`...) eine übersichtliche Kreuztabelle über alle Läufe inklusive der Zeile **„Freies Kart (Pause in Box)“**.
* **Sortierung nach schnellster Gesamtzeit:** Sowohl in der Live-Matrix als auch auf dem DIN-A4-Wertungsaushang sortieren sich die Fahrerpositionen (`P1, P2...` bzw. `#1 bis #N`) automatisch nach der schnellsten Gesamtzeit.
* **TV- / Monitor-Vollbildmodus:** Mit einem Klick lässt sich die Matrix als kontraststarker **Live-Screen** für die Boxengasse oder das Fahrerlager im Vollbild öffnen (der aktuell auf der Bahn befindliche Lauf pulsiert grün).

### 5. Live-Karten-Cockpit & Finalläufe (KaRaS Start / Stopp)
* **Karten-Workflow:** Jeder Lauf wird als Status-Karte geführt (*Wartet auf KaRaS Start* $\rightarrow$ *KaRaS läuft live* $\rightarrow$ *KaRaS Stopp erkannt*).
* **Flexible Kart-Vergabe:** Vor jedem Lauf können Karts manuell per Dropdown getauscht, in **Zahlenfolge (1, 2, 3...)** vergeben oder **per Zufall ausgelost** werden.
* **Finalläufe nach Rundenanzahl (Langsamste Gruppe startet zuerst):**
  * Das System teilt die Finalgruppen anhand der Qualifying-Gesamtzeit ein und startet automatisch **die langsamste Gruppe zuerst** (z. B. erst *Finale Gruppe B*, danach *Finale Gruppe A* um den Gesamtsieg).
  * Im Finale erkennt KaRaS ebenfalls automatisch Start und Stopp, wertet aber **nach Position / Rundenanzahl** (meiste Runden = Platz 1, Tie-Breaker: beste Rundenzeit).
  * Jede Finalgruppe erhält sofort nach Zieldurchfahrt ihre **eigene Einzelwertung (A4)**; sobald Gruppe A im Ziel ist, steht zusätzlich die **kombinierte Gesamtwertung über alle Gruppen** bereit.

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
│   │   ├── StepSetup.tsx               # Modul 1: Event-Art, Karts & Smartphone-Link
│   │   ├── StepRotationBoard.tsx       # Modul 2: Gruppen-Matrix & TV-Live-Screen
│   │   ├── StepLiveCards.tsx           # Modul 3: Live-Karten-Cockpit (Qualifying)
│   │   ├── StepFinals.tsx              # Modul 4: Finalläufe (Gr. B vor Gr. A, Rundenwertung)
│   │   └── StepPrintA4.tsx             # Modul 5: DIN-A4 Matrix-Aushänge & Sieger-Urkunde
│   └── app/
│       ├── api/
│       │   └── event/
│       │       └── route.ts            # Lokale REST-API für Smartphone-Live-Sync
│       ├── mobile/
│       │   └── page.tsx                # Separate Smartphone-App zur Fahrer-Erfassung
│       ├── globals.css                 # Tailwind CSS Basis-Styles
│       ├── layout.tsx                  # Root-Layout
│       └── page.tsx                    # Haupt-Applikation (HR-RaceMaster Cockpit)
├── next.config.mjs                     # Next.js Konfiguration (inkl. Workspace-Fix)
├── postcss.config.js                   # PostCSS Konfiguration
├── tailwind.config.js                  # Tailwind CSS Konfiguration
├── package.json                        # Abhängigkeiten & Start-Skripte
├── start-linux.sh                      # 1-Klick-Installer & Starter für Linux Mint
├── start-windows.bat                   # 1-Klick-Installer & Starter für Windows
└── README.md                           # Diese Dokumentation
```

---

## Voraussetzungen

* **Node.js** (Version 18 LTS oder 20 LTS empfohlen)
* **Python 3** (ab Version 3.8 – benötigt **keine** externen `pip`-Pakete)
* **Git** (optional, alternativ Download als ZIP von GitHub)

---

## Schnellstart per 1-Klick-Skript (Empfohlen)

Damit keine Befehle von Hand eingetippt werden müssen, enthält das Projekt fertige Starter-Skripte für **Linux Mint** und **Windows**. Sie prüfen automatisch, ob alle Pakete (`node_modules`, `autoprefixer`, `tailwindcss`) vorhanden sind, starten die **KaRaS-Bridge (Port 8080)** im Hintergrund und öffnen den Browser auf `http://localhost:3000`.

### Unter Linux Mint starten
```bash
cd ~/Schreibtisch/hr-racemaster
chmod +x start-linux.sh
./start-linux.sh
```

### Unter Windows (10 / 11) starten
1. Projektordner im Windows Explorer öffnen.
2. Doppelklick auf **`start-windows.bat`**.

---

## Manuelle Installation unter Linux Mint (Hauptsystem mit KaRaS / Wine)

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

### 2. Repository klonen & Pakete installieren
```bash
cd /home/kart
git clone https://github.com/motionrain/hr-racemaster.git
cd hr-racemaster

# Installiert automatisch Next.js, React, Tailwind CSS, PostCSS & Autoprefixer
npm install
```

### 3. Produktions-Build erstellen & starten
```bash
npm run build
npm start
```
Das System läuft nun im gesamten lokalen Netzwerk auf Port `3000`:
* **Haupt-Cockpit am PC:** `http://localhost:3000`
* **Smartphone Check-In:** `http://<IP-DES-PC>:3000/mobile`

---

## Manuelle Installation unter Windows (10 / 11)

1. **Node.js & Python installieren:**
   * Lade **Node.js (LTS)** von [nodejs.org](https://nodejs.org/) herunter und installiere es.
   * Lade **Python 3** von [python.org](https://www.python.org/) herunter (wichtig: beim Setup das Häkchen bei **„Add Python to PATH“** setzen).
2. **Projekt herunterladen & installieren:**
   Öffne die **PowerShell** im Projektordner:
   ```powershell
   git clone https://github.com/motionrain/hr-racemaster.git
   cd hr-racemaster
   npm install
   ```
3. **Server starten:**
   ```powershell
   npm run dev
   ```
4. *(Optional)* Falls im Windows-Benutzerordner eine ältere `package-lock.json` liegt und Next.js eine Workspace-Warnung anzeigt, kann diese mit folgendem Befehl entfernt werden:
   ```powershell
   Remove-Item "$env:USERPROFILE\package-lock.json" -ErrorAction SilentlyContinue
   ```

---

## Lokales Netzwerk (WLAN), Smartphone-Erfassung & Firewall einrichten

Damit Smartphones (`/mobile`) und Tablets in der Boxengasse über das WLAN auf den Hauptrechner zugreifen können, startet `HR-RaceMaster` standardmäßig mit `next dev -H 0.0.0.0` bzw. `next start -H 0.0.0.0`.

Die genaue WLAN-Adresse deines Rechners wird dir automatisch im Menü **`1. Event & Karts`** im gelben Smartphone-Banner angezeigt (z. B. `http://192.168.2.169:3000/mobile`).

Falls das Smartphone die Seite im WLAN nicht erreicht, müssen einmalig die Ports `3000` (Web-App) und `8080` (KaRaS-Bridge) in der lokalen Firewall freigegeben werden:

### Firewall-Freigabe unter Linux Mint
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
```

### Firewall-Freigabe unter Windows (PowerShell als Administrator)
```powershell
New-NetFirewallRule -DisplayName "HR-RaceMaster Web & Bridge" -Direction Inbound -LocalPort 3000,8080 -Protocol TCP -Action Allow
```

---

## KaRaS Live-Bridge & Systemd-Autostart (Linux Mint)

Die Datei `scripts/karas_bridge.py` überwacht das KaRaS-Verzeichnis (`/home/kart/.wine32/drive_c/KaRaS`), erkennt Rennstarts und Rennstopps in der aktuellen `RE*.dat`-Datei und liefert jede gefahrene Runde sowie die Rundenanzahl live an **`http://localhost:8080/status`**.

### 1. KaRaS-Bridge als Systemd-Dienst aktivieren
```bash
sudo cp /home/kart/hr-racemaster/scripts/hr-racemaster-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hr-racemaster-bridge.service
sudo systemctl start hr-racemaster-bridge.service
```

### 2. HR-RaceMaster Web-App als Systemd-Dienst aktivieren
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

### 3. Desktop-Icon auf dem Linux-Mint-Schreibtisch anlegen
```bash
cat << 'EOF' > /home/kart/Schreibtisch/HR-RaceMaster.desktop
[Desktop Entry]
Version=1.1
Type=Application
Name=HR-RaceMaster
Comment=Rennleitung, KartRolling & Live-Auswertung
Exec=xdg-open http://localhost:3000
Icon=applications-games
Terminal=false
Categories=Application;
EOF

chmod +x /home/kart/Schreibtisch/HR-RaceMaster.desktop
```

---

## Nützliche Befehle für Betrieb & Wartung

| Aktion | Befehl |
| :--- | :--- |
| **Web-App im Entwicklungsmodus starten** | `npm run dev` |
| **Produktions-Build erstellen** | `npm run build` |
| **Produktions-Server starten (WLAN-aktiv)** | `npm start` |
| **KaRaS-Bridge manuell starten (Linux)** | `npm run bridge` |
| **KaRaS-Bridge manuell starten (Windows)** | `npm run bridge:win` |
| **Letzte KaRaS `RE*.dat` Datei inspizieren** | `npm run bridge:inspect` |
| **Status Web-Dienst prüfen (Linux Mint)** | `systemctl status hr-racemaster-web.service` |
| **Status Bridge-Dienst prüfen (Linux Mint)** | `systemctl status hr-racemaster-bridge.service` |

---

## Lizenz & Urheberrecht

**© Copyright Hans Richter** – Alle Rechte vorbehalten.  
Konzipiert und entwickelt für den professionellen Kartsport- und Eventbetrieb.
