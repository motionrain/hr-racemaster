#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HR-RaceMaster – KaRaS Live Bridge (Port 8080)
Liest Rundenzeiten, Rundenanzahl (Laps) und Rennstatus (Start/Stopp)
in Echtzeit aus den binären KaRaS RE*.dat Dateien aus.
Kompatibel mit Linux Mint (Wine) und Windows.
"""

import os
import sys
import glob
import time
import json
import struct
import threading
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer

# Standardpfad unter Linux Mint (Wine) bzw. Fallback für Windows
DEFAULT_LINUX_DIR = "/home/kart/.wine32/drive_c/KaRaS"
DEFAULT_WIN_DIR = r"C:\KaRaS"

KARAS_DIR = os.environ.get(
    "KARAS_DIR",
    DEFAULT_LINUX_DIR if os.name != "nt" else DEFAULT_WIN_DIR
)
PORT = int(os.environ.get("BRIDGE_PORT", "8080"))

# Optionales Mapping: Falls KaRaS Transponder-IDs statt Kart-Nummern (1-14) schreibt,
# können hier feste Zuordnungen hinterlegt werden (z.B. {101: "1", 102: "2"}).
TRANSPONDER_TO_KART = {}

# Globaler Live-Status für die Next.js App (useKarasBridge.ts)
state_lock = threading.Lock()
bridge_state = {
    "race_active": False,
    "current_file": None,
    "updated_at": 0.0,
    "karts": {}  # Format: { "1": { "best_lap": 41.250, "last_lap": 41.800, "laps": 5 } }
}


def get_latest_re_file(directory: str):
    """Sucht die aktuellste RE*.dat / RE*.DAT Datei im KaRaS-Ordner."""
    files = (
        glob.glob(os.path.join(directory, "RE*.dat")) +
        glob.glob(os.path.join(directory, "RE*.DAT"))
    )
    return max(files, key=os.path.getmtime) if files else None


def reset_heat_stats():
    """Setzt die Rundenzeiten zu Beginn eines neuen Laufs zurück."""
    with state_lock:
        bridge_state["karts"] = {}
        bridge_state["updated_at"] = time.time()


def parse_16byte_lap_packet(packet: bytes):
    """
    Analysiert ein 16-Byte Transponder-Paket aus KaRaS.
    Struktur:
      Bytes 0..3:   Header (oft 0x5b 0x74 0x61 0x63 -> '[tac')
      Bytes 4..7:   Kart-ID / Kanal / Transponder (uint8 / uint16 / uint32)
      Bytes 8..15:  Zeitstempel oder Rundenzeit in Millisekunden (uint32)
    Gibt (kart_str, lap_seconds) zurück oder (None, None), falls kein gültiges Rundenpaket.
    """
    if len(packet) != 16:
        return None, None

    # Steuer-Header (0x01 / 0x02) ausschließen
    if packet.startswith(b'\x01\x00\x00\x00') or packet.startswith(b'\x02\x00\x00\x00'):
        return None, None

    # 1. Kart-Nummer / Kanal ermitteln
    # Prüft Byte 4 bzw. uint16 an Offset 4 oder 6
    raw_id_b4 = packet[4]
    raw_id_u16 = struct.unpack("<H", packet[4:6])[0]
    raw_id_u16_alt = struct.unpack("<H", packet[6:8])[0]

    kart_num = None
    if raw_id_u16 in TRANSPONDER_TO_KART:
        kart_num = TRANSPONDER_TO_KART[raw_id_u16]
    elif raw_id_b4 in TRANSPONDER_TO_KART:
        kart_num = TRANSPONDER_TO_KART[raw_id_b4]
    elif 1 <= raw_id_b4 <= 25:
        kart_num = str(raw_id_b4)
    elif 1 <= raw_id_u16 <= 25:
        kart_num = str(raw_id_u16)
    elif 1 <= raw_id_u16_alt <= 25:
        kart_num = str(raw_id_u16_alt)

    # 2. Rundenzeit in Millisekunden suchen (Plausibilitätsfenster: 15.000 ms bis 180.000 ms)
    lap_ms = None
    for offset in (8, 12, 6, 10):
        if offset + 4 <= 16:
            val = struct.unpack("<I", packet[offset:offset + 4])[0]
            if 15000 <= val <= 180000:
                lap_ms = val
                break

    if kart_num is None or lap_ms is None:
        return None, None

    return kart_num, round(lap_ms / 1000.0, 3)


def record_lap(kart_str: str, lap_sec: float):
    """Aktualisiert Rundenanzahl, letzte Runde und Bestzeit für das jeweilige Kart."""
    with state_lock:
        karts = bridge_state["karts"]
        if kart_str not in karts:
            karts[kart_str] = {
                "best_lap": lap_sec,
                "last_lap": lap_sec,
                "laps": 1
            }
        else:
            entry = karts[kart_str]
            entry["laps"] += 1
            entry["last_lap"] = lap_sec
            if lap_sec < entry["best_lap"]:
                entry["best_lap"] = lap_sec
        bridge_state["updated_at"] = time.time()


def watcher_loop(karas_dir: str):
    """
    Hintergrund-Thread: Überwacht RE*.dat exakt nach dem v25-Schema
    (inkl. 336-Byte-Aggregationsschutz über Header 0x01 / 0x02).
    """
    current_file = None
    file_pos = 0
    is_idle = True
    cooldown_until = 0.0

    print(f"[HR-RaceMaster Bridge] Überwache KaRaS-Ordner: {karas_dir}")

    while True:
        try:
            latest_file = get_latest_re_file(karas_dir)
            if latest_file != current_file:
                current_file = latest_file
                if current_file and os.path.exists(current_file):
                    with open(current_file, "rb") as f:
                        f.seek(0, os.SEEK_END)
                        file_pos = f.tell() - (f.tell() % 16)
                    with state_lock:
                        bridge_state["current_file"] = os.path.basename(current_file)
                    print(f"[HR-RaceMaster Bridge] Aktive Datei: {current_file} (Offset {file_pos})")

            if current_file and os.path.exists(current_file):
                with open(current_file, "rb") as f:
                    f.seek(file_pos)
                    chunk = f.read()

                if chunk:
                    chunk_len = len(chunk)
                    now = time.time()

                    # FALL 1: System im Ruhezustand -> Rennstart erkennen
                    if is_idle and now >= cooldown_until:
                        if chunk_len >= 16:
                            file_pos += chunk_len
                            is_idle = False
                            reset_heat_stats()
                            with state_lock:
                                bridge_state["race_active"] = True
                                bridge_state["updated_at"] = now
                            print("[HR-RaceMaster Bridge] 🟢 RENNSTART erkannt!")

                    # FALL 2: Rennen läuft -> Stopp-Signal oder 16-Byte-Rundenzeiten prüfen
                    elif not is_idle:
                        is_stop = (
                            chunk_len % 16 != 0 or
                            chunk.startswith(b'\x01\x00\x00\x00') or
                            chunk.startswith(b'\x02\x00\x00\x00')
                        )
                        if is_stop:
                            file_pos += chunk_len
                            is_idle = True
                            cooldown_until = time.time() + 3.0
                            with state_lock:
                                bridge_state["race_active"] = False
                                bridge_state["updated_at"] = time.time()
                            print("[HR-RaceMaster Bridge] 🏁 RENNENDE / STOPP erkannt!")
                        elif chunk_len >= 16:
                            processable_len = chunk_len - (chunk_len % 16)
                            for i in range(0, processable_len, 16):
                                pkt = chunk[i:i + 16]
                                kart_str, lap_sec = parse_16byte_lap_packet(pkt)
                                if kart_str and lap_sec:
                                    record_lap(kart_str, lap_sec)
                                    print(f"  -> Kart {kart_str}: {lap_sec:.3f} s")
                            file_pos += processable_len

            time.sleep(0.05)
        except Exception as exc:
            time.sleep(0.1)


class BridgeHTTPRequestHandler(BaseHTTPRequestHandler):
    """Stellt den Live-Status auf http://localhost:8080/status (inkl. CORS) bereit."""

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/status"):
            with state_lock:
                payload = json.dumps(bridge_state).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith("/reset"):
            reset_heat_stats()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"status":"reset_ok"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Unterdrückt das Fluten des Terminals bei sekündlichen Polls
        return


def inspect_latest_file(karas_dir: str):
    """Diagnose-Modus (--inspect): Zeigt die letzten 16-Byte-Pakete im Hex- und Zahlenformat."""
    latest = get_latest_re_file(karas_dir)
    if not latest:
        print(f"Keine RE*.dat Datei in {karas_dir} gefunden.")
        return

    print(f"=== Diagnose für Datei: {latest} ===")
    size = os.path.getsize(latest)
    print(f"Dateigröße: {size} Bytes")

    with open(latest, "rb") as f:
        # Letzte 320 Bytes (20 Pakete à 16 Bytes) anzeigen
        start_pos = max(0, size - 320)
        start_pos -= start_pos % 16
        f.seek(start_pos)
        data = f.read()

    for idx in range(0, len(data), 16):
        pkt = data[idx:idx + 16]
        if len(pkt) < 16:
            break
        hex_str = " ".join(f"{b:02x}" for b in pkt)
        ascii_str = "".join(chr(b) if 32 <= b <= 126 else "." for b in pkt[:4])
        u32_vals = struct.unpack("<IIII", pkt)
        kart_str, lap_sec = parse_16byte_lap_packet(pkt)
        parsed_info = f"Kart {kart_str}: {lap_sec:.3f}s" if kart_str else "-"
        print(f"Offset {start_pos + idx:06d} | {hex_str} | '{ascii_str}' | u32={u32_vals} | {parsed_info}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HR-RaceMaster KaRaS Live Bridge")
    parser.add_argument("--dir", default=KARAS_DIR, help="Pfad zum KaRaS-Verzeichnis")
    parser.add_argument("--port", type=int, default=PORT, help="HTTP-Port (Standard: 8080)")
    parser.add_argument("--inspect", action="store_true", help="Diagnose der letzten RE*.dat Datei")
    args = parser.parse_args()

    if args.inspect:
        inspect_latest_file(args.dir)
        sys.exit(0)

    t = threading.Thread(target=watcher_loop, args=(args.dir,), daemon=True)
    t.start()

    server = HTTPServer(("0.0.0.0", args.port), BridgeHTTPRequestHandler)
    print(f"[HR-RaceMaster Bridge] API läuft auf http://localhost:{args.port}/status")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[HR-RaceMaster Bridge] Beendet.")
