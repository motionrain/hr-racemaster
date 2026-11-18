# HR-RaceMaster © Copyright Hans Richter

**Modulares Event-, Gruppen- & KartRolling-Managementsystem mit KaRaS-Echtzeitanbindung (v31), Ersatztransponder-Automatik & Offline-QR-Code Smartphone Check-In**

Entwickelt für den professionellen Kartbahn-Betrieb unter **Linux Mint (Wine)** und **Windows**.

---

## Überblick & Kernfunktionen

**HR-RaceMaster** digitalisiert und automatisiert die Durchführung großer Gruppen-Events (20 bis 40+ Fahrer) im Bahnbetrieb komplett lokal im eigenen Netzwerk (100 % offline-fähig, ohne Cloud-Zwang):

### 1. Zwei Haupt-Rennformate
* **GP Rennen (Grand Prix):** Optionales Warm-up $\rightarrow$ 1 bis 5 Qualifikationsläufe $\rightarrow$ Finalläufe (Gruppe C $\rightarrow$ Gruppe B $\rightarrow$ Gruppe A).
* **KartRolling (Jeder fährt mit jedem Kart der Gruppe):** Optionales Warm-up $\rightarrow$ Vollautomatische Kart-Rotation nach dem Prinzip des Lateinischen Quadrats für alle Gruppen (`Gruppe A`, `Gruppe B`, `Gruppe C`...). Auch kleinere Gruppen (z. B. 6er-Gruppe bei einer `7 / 7 / 6`-Aufteilung) fahren alle Läufe, damit jeder Fahrer auf exakt dieselbe Anzahl gewerteter Fahrten kommt.

### 2. Flotten-Management, Ersatztransponder & freie Streckenbelegung
* **Flotten-Umschalter:** Wechsel per Klick zwischen **Erwachsenen-Flotte (Kart 1–14)** und **Kinderkarts (Kids 1–8)**.
* **Defekt- & Sperr-Logik:** Defekte Karts oder gesperrte Startnummern (z. B. *Kart 13* bei Aberglaube) werden per Klick deaktiviert und in allen Gruppen- und Rotationsberechnungen automatisch übersprungen.
* **Frei wählbare Streckenbelegung:** Die maximale Kartanzahl pro Gruppe lässt sich frei zwischen `1` und `25` einstellen (inkl. `-` / `+` Tasten und Schnellwahl für `Max. 6`, `7`, `8`, `9`, `10`, `12` oder `Alle Aktiven`).
* **Manuelle Gruppen-Kart-Verteilung:** Sowohl im Setup (`1. Event & Karts`), in der Rotations-Matrix (`2. Gruppen & Rotation`) als auch im Live-Rennen (`3. Live-Karten`) können die Karts jeder Gruppe manuell per Klick zugewiesen, in Zahlenfolge (`1, 2, 3...`) vergeben oder per Zufall ausgelost werden.

### 3. Smartphone Fahrer-Erfassung über WLAN (`/mobile`) mit Offline-QR-Code
* **Integrierter Offline-QR-Code-Generator (`QrCodeModal.tsx`):** Erzeugt den passenden QR-Code für `http://<IP-DES-PC>:3000/mobile` direkt lokal im Browser (ohne externe Internet-Dienste). Der QR-Code ist im Setup direkt sichtbar und über den Button **`📱 Mobile QR-Code`** jederzeit auf jedem Bildschirm abrufbar.
* **Mobiles Check-In-Modul:** Mitarbeiter oder Gäste scannen den QR-Code mit der Smartphone-Kamera, geben Fahrernamen einzeln oder als Liste ein, korrigieren Tippfehler oder löschen Einträge.
* **Echtzeit-Synchronisation:** Jeder am Smartphone erfasste Name wird über die lokale API (`/api/event`, RAM- & `/tmp`-gestützt) innerhalb von 1,5 Sekunden live an den Haupt-PC übertragen und automatisch auf alle Gruppen synchronisiert.

### 4. Gruppen- & Rotations-Matrix (Live-Screen & Boxengassen-Aushang)
* **Gesamtansicht aller Gruppen:** Zeigt für jede Gruppe (`Gruppe A`, `Gruppe B`, `Gruppe C`...) eine übersichtliche Kreuztabelle über alle Läufe inklusive direkter Kart-Auswahl pro Zelle.
* **Sortierung nach schnellster Gesamtzeit:** Sowohl in der Live-Matrix als auch auf dem DIN-A4-Wertungsaushang sortieren sich die Fahrerpositionen (`P1, P2...` bzw. `#1 bis #N`) automatisch nach der schnellsten Gesamtzeit.
* **TV- / Monitor-Vollbildmodus:** Mit einem Klick lässt sich die Matrix als kontraststarker **Live-Screen** für die Boxengasse oder das Fahrerlager im Vollbild öffnen.

### 5. Live-Karten-Cockpit (Nur aktive Transponder) & Finalläufe
* **Aktive Transponder Live-Ansicht:** In der Live-Wertungstabelle (`3. Live-Karten`) erscheinen Fahrernamen und Karts erst dann, sobald ihr Transponder in KaRaS tatsächlich über die Induktionsschleife erfasst wurde. Dadurch wird verhindert, dass nicht gefahrene oder leere Karts auf dem Ausdruck landen.
* **Automatische Kart-Übernahme:** Steigt ein Fahrer in der Boxengasse in ein anderes freies Kart als ursprünglich geplant, ordnet das System den neu erfassten Transponder automatisch dem nächsten freien Fahrer der Gruppe zu.
* **Strikte Lauftrennung (`/reset` & Nachzügler-Sperre):** Beim Wechsel zum nächsten Lauf (`NEXT`) wird der Zwischenspeicher der Python-Bridge automatisch zurückgesetzt und Nachzügler aus der Auslaufrunde des Vorlaufs werden blockiert.
* **Finalläufe nach Rundenanzahl (Langsamste Gruppe startet zuerst):**
  * Das System teilt die Finalgruppen anhand der Qualifying-Gesamtzeit ein und startet automatisch **die langsamste Gruppe zuerst** (z. B. erst *Finale Gruppe C* $\rightarrow$ *Finale Gruppe B* $\rightarrow$ *Finale Gruppe A* um den Gesamtsieg).
  * Im Finale wertet das System **nach Position / Rundenanzahl** (meiste Runden = Platz 1, Tie-Breaker: beste Rundenzeit).

### 6. Optimierte DIN-A4-Ausdrucke & Sieger-Urkunde
* **Große, kontraststarke Lesbarkeit:** Alle DIN-A4-Ausdrucke (Einzellauf, Gruppen-Rotationsplan, Qualifying-Gesamtwertung, Finale Einzelgruppe, Finale Gesamtwertung) nutzen große Fahrernamen und deutlich eingerahmte Kart-Boxen (`KART 1`..`KART 14`).
* **Filter gegen leere Karts:** Auf Ergebnis-Ausdrucken werden Karts ohne erfassten Transponder standardmäßig ausgeblendet, damit Kunden keine leeren Zeilen mit `0 Runden` sehen.

---

## KaRaS Live-Bridge v31 (`scripts/karas_bridge.py`)

Die Python-Bridge (`v31`) liest die binären `RE*.dat`-Tagesdateien sowie die `Kartlist.Log` aus dem KaRaS-Verzeichnis (`/home/kart/.wine32/drive_c/KaRaS`) in Echtzeit aus:
* **16-Byte-Transponder-Dekodierung:** Erkennt die 1. Überfahrt (`crossing_num == 1`) sofort als aktiven Transponder (`🟢 [Transponder Aktiv]`) und berechnet ab der 2. Überfahrt (`crossing_num >= 2`) die exakte Rundenzeit auf die Hundertstelsekunde (`1/100 s`).
* **`Kartlist.Log` & Ersatztransponder-Automatik:** Alle 54 Karts inklusive sämtlicher Ersatztransponder mit Sonderzeichen (`6-`, `6+`, `1-`, `7-`, `8.`, `11-`, `11.`, `13.`, `04`, `Black 8`, `Sodi SR4 Nr.33` $\rightarrow$ `Kart 3`, `Sodi 2 Drive` $\rightarrow$ `Kart 15`) werden automatisch auf die saubere Basis-Kartnummer (`Kart 1` bis `Kart 15`) gemappt.

---

## Projektstruktur

```text
hr-racemaster/
├── scripts/
│   └── karas_bridge.py                 # Python Echtzeit-Bridge v31 für KaRaS RE*.dat & Kartlist.Log (Port 8080)
├── src/
│   ├── types/
│   │   └── kart.ts                     # TypeScript-Interfaces & Datenmodelle
│   ├── lib/
│   │   └── raceLogic.ts                # Berechnungslogik (Gruppen-Sync, KartRolling, aktive Transponder, Finale)
│   ├── hooks/
│   │   └── useKarasBridge.ts           # React-Hook für stabiles KaRaS-Polling, Auto-Reset & Kart-Zuordnung
│   ├── components/
│   │   ├── Header.tsx                  # Kopfzeile, Mobile QR-Code-Button & Theme-Schalter
│   │   ├── QrCodeModal.tsx             # Offline ISO-QR-Code-Generator (SVG) & Modal-Ansicht
│   │   ├── StepSetup.tsx               # Modul 1: Event-Art, Karts, Gruppen-Karts & Smartphone QR-Code
│   │   ├── StepRotationBoard.tsx       # Modul 2: Gruppen-Matrix, Manuelle Kart-Wahl & TV-Live-Screen
│   │   ├── StepLiveCards.tsx           # Modul 3: Live-Karten-Cockpit (Nur aktive Transponder + Kart-Verteiler)
│   │   ├── StepFinals.tsx              # Modul 4: Finalläufe (Langsamste Gruppe zuerst, Rundenwertung)
│   │   └── StepPrintA4.tsx             # Modul 5: Große DIN-A4-Aushänge (ohne leere Karts) & Sieger-Urkunde
│   └── app/
│       ├── api/
│       │   └── event/
│       │       └── route.ts            # Absturzsichere REST-API (RAM + /tmp) für Smartphone-Live-Sync
│       ├── mobile/
│       │   └── page.tsx                # Separate Smartphone-App zur Fahrer-Erfassung
│       ├── globals.css                 # Tailwind CSS Basis-Styles
│       ├── layout.tsx                  # Root-Layout (inkl. Next.js 15 Event-Error-Guard)
│       └── page.tsx                    # Haupt-Applikation (HR-RaceMaster Cockpit)
├── .gitignore                          # Git-Ausnahmen (node_modules, .next, Logs)
├── next.config.mjs                     # Next.js Konfiguration
├── postcss.config.js                   # PostCSS Konfiguration
├── tailwind.config.js                  # Tailwind CSS Konfiguration
├── package.json                        # Abhängigkeiten & Start-Skripte
├── start-linux.sh                      # 1-Klick Produktions-Starter & Live-Transponder-Konsole (Linux Mint)
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

Das Starter-Skript `start-linux.sh` beendet automatisch alte hängende Prozesse, erstellt bei Bedarf den schnellen **Produktions-Build (`npm run build`)**, startet den Webserver (`Port 3000`) sowie die **KaRaS-Bridge v31 (`Port 8080`)** und zeigt im offenen Terminal-Fenster die **Live-Transponder-Konsole** an.

### Unter Linux Mint starten
```bash
cd ~/Schreibtisch/hr-racemaster
chmod +x start-linux.sh
./start-linux.sh
```

### Schreibtisch-Starter (`HR-RaceMaster Starten`) unter Linux Mint anlegen
```bash
cat << 'EOF' > /home/kart/Schreibtisch/HR-RaceMaster.desktop
[Desktop Entry]
Version=1.0
Type=Application
Name=HR-RaceMaster Starten
Comment=Startet HR-RaceMaster & KaRaS Live-Transponder-Konsole
Exec=/home/kart/Schreibtisch/hr-racemaster/start-linux.sh
Icon=applications-games
Terminal=true
Categories=Application;
EOF

chmod +x /home/kart/Schreibtisch/HR-RaceMaster.desktop
gio set /home/kart/Schreibtisch/HR-RaceMaster.desktop metadata::trusted true 2>/dev/null || true
```

### Unter Windows (10 / 11) starten
1. Projektordner im Windows Explorer öffnen.
2. Doppelklick auf **`start-windows.bat`**.

---

## Update von GitHub auf den Linux-Mint Kart-PC ziehen

Wenn Änderungen auf GitHub (`motionrain/hr-racemaster`) hochgeladen wurden, genügt auf dem Kart-PC folgender Befehl im Terminal, um das Update zu laden und den Produktions-Build neu zu erstellen:

```bash
cd /home/kart/Schreibtisch/hr-racemaster
git pull
pkill -9 -f "next" 2>/dev/null || true
rm -rf .next
npm run build
./start-linux.sh
```

---

## Lokales Netzwerk (WLAN), Smartphone-Erfassung & Firewall

Damit Smartphones (`/mobile`) und Tablets in der Boxengasse über das WLAN auf den Hauptrechner zugreifen können, läuft `HR-RaceMaster` auf `0.0.0.0:3000`. Falls das Smartphone die Seite im WLAN nicht erreicht, einmalig die Ports `3000` und `8080` in der Firewall freigeben:

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

## Nützliche Befehle für Betrieb & Diagnose

| Aktion | Befehl |
| :--- | :--- |
| **Komplettsystem mit Live-Konsole starten (Linux)** | `./start-linux.sh` |
| **Produktions-Build nach Code-Update neu bauen** | `rm -rf .next && npm run build` |
| **Produktions-Server manuell starten** | `npm start` |
| **KaRaS-Bridge v31 manuell im Vordergrund starten** | `python3 scripts/karas_bridge.py` |
| **Diagnose: Letzte `RE*.dat` & `Kartlist.Log` prüfen** | `python3 scripts/karas_bridge.py --inspect` |
| **Live-Protokoll der Transponder im Terminal mitlesen** | `tail -f /tmp/karas_bridge.log` |

---

## Lizenz & Urheberrecht

**© Copyright Hans Richter** – Alle Rechte vorbehalten.  
Konzipiert und entwickelt für den professionellen Kartsport- und Eventbetrieb.
