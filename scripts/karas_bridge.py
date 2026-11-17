#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HR-RaceMaster – KaRaS Live Bridge v31 (Port 8080)
- Liest Kartlist.Log & alle Ersatztransponder (6-, 6+, 1-, 7-, 8., 11-, 11., 13., 04, Black 8)
- Meldet jedes Kart sofort ab der 1. Transponder-Erfassung als active=True an das Live-Board
"""

import os
import re
import sys
import glob
import time
import json
import struct
import signal
import subprocess
import threading
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DEFAULT_LINUX_DIR = "/home/kart/.wine32/drive_c/KaRaS"
DEFAULT_WIN_DIR = r"C:\KaRaS"

KARAS_DIR = os.environ.get(
    "KARAS_DIR",
    DEFAULT_LINUX_DIR if os.name != "nt" else DEFAULT_WIN_DIR
)
PORT = int(os.environ.get("BRIDGE_PORT", "8080"))

BASE_TRANSPONDER_TABLE = {
    0x3d: ("5",  "Sodi LR5 Premium Nr5 [Nr. 5]"),
    0x49: ("8",  "Sodi LR5 Premium Nr8 [Nr. 8]"),
    0x4f: ("11", "Sodi SR4 Nr.11- [Nr. 11-]"),
    0x50: ("3",  "Sodi LR5 Premium Nr3 [Nr. 3]"),
    0x53: ("2",  "Sodi LR5 Premium Nr2 [Nr. 2]"),
    0x57: ("4",  "Sodi LR5 Premium Nr4 [Nr. 4]"),
    0x58: ("7",  "Sodi LR5 Premium Nr7 [Nr. 7]"),
    0x59: ("7",  "Sodi SR4 Nr.7 [Nr. 7]"),
    0x5a: ("4",  "Sodi SR4 Nr.4 [Nr. 4]"),
    0x5b: ("8",  "Sodi SR4 Nr.8 [Nr. 8.]"),
    0x5d: ("6",  "Sodi LR5 Premium Nr6 [Nr. 6]"),
    0x5e: ("5",  "Sodi SR4 Nr.5 [Nr. 5]"),
    0x5f: ("15", "Sodi 2 Drive [Nr. 15]"),
    0x60: ("4",  "Sodi SR4 Nr.10 [Kartnr 4]"),
    0x61: ("1",  "Sodi SR4 Nr.1 [Nr. 1]"),
    0x62: ("3",  "Sodi SR4 Nr.3 [Nr. 3]"),
    0x63: ("14", "Sodi SR4 Nr.14 [Nr. 14]"),
    0x64: ("7",  "Sodi SR4 Nr.7 [Nr. 7]"),
    0x65: ("12", "Sodi SR4 Nr.12 [Nr. 12]"),
    0x67: ("10", "Sodi SR4 Nr.10 [Nr. 10]"),
    0x69: ("3",  "Sodi SR4 Nr.33 [Ersatz Nr. 3]"),
    0x6e: ("4",  "Sodi SR4 Nr.4 [Nr. 4]"),
    0x70: ("13", "Sodi SR4 Nr.13 [Nr. 13]"),
    0x71: ("10", "Sodi SR4 Nr.10 [Nr. 10]"),
    0x72: ("4",  "Sodi SR4 Nr.04 [Ersatz Nr. 4]"),
    0x74: ("6",  "Sodi SR4 Nr.6 [Funk 0F49E0 / Nr. 6]"),
    0x75: ("13", "Sodi SR4 Nr.13 [Nr. 13]"),
    0x76: ("6",  "Sodi SR4 Nr.6 [Ersatz Nr. 6+]"),
    0x77: ("11", "Sodi SR4 Nr.11. [Ersatz Nr. 11.]"),
    0x79: ("8",  "Black 8 [Ersatz Nr. 8]"),
    0x7a: ("12", "Sodi SR4 Nr.12 [Nr. 12]"),
    0x7b: ("8",  "Sodi SR4 Nr.8 [Nr. 8]"),
    0x7c: ("12", "Sodi SR4 Nr.12 [Nr. 12]"),
    0x7d: ("7",  "Sodi SR4 Nr.7- [Ersatz Nr. 7-]"),
    0x7f: ("6",  "Sodi SR4 NR.6- [Ersatz Nr. 6-]"),
    0x80: ("13", "Sodi SR4 Nr.13 [Ersatz Nr. 13.]"),
    0x81: ("12", "Sodi SR4 NR.12 [Ersatz Nr. 12]"),
    0x82: ("1",  "Sodi SR4 Nr.1- [Ersatz Nr. 1-]"),
}

TRANSPONDER_TO_KART = {}
TRANSPONDER_LABELS = {}
KARTLIST_NAME_TO_NUM = {}

state_lock = threading.Lock()
bridge_state = {
    "race_active": False,
    "start_seq": 0,
    "stop_seq": 0,
    "current_file": None,
    "updated_at": 0.0,
    "karts": {},
    "transponder_map": {},
    "last_raw_packets": []
}

waiting_for_new_start = False
seen_counter = 0


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def stop_old_bridge_instances():
    if os.name == "nt":
        return
    my_pid = os.getpid()
    try:
        out = subprocess.check_output(["pgrep", "-f", "karas_bridge.py"], text=True)
        for line in out.splitlines():
            pid = int(line.strip())
            if pid != my_pid:
                os.kill(pid, signal.SIGTERM)
                time.sleep(0.2)
    except Exception:
        pass


def normalize_kart_number(raw_nr: str, raw_name: str, funk_id: str = "") -> str:
    if funk_id.upper() == "0F49E0":
        return "6"
    if raw_nr:
        clean_nr = re.sub(r"[^0-9]", "", raw_nr.strip())
        if clean_nr:
            num = int(clean_nr)
            if num == 33:
                return "3"
            if 1 <= num <= 25:
                return str(num)
    if "2 DRIVE" in raw_name.upper():
        return "15"
    m_name = re.search(r"(?:Nr\.?|Black)\s*0*(\d+)", raw_name, re.IGNORECASE)
    if m_name:
        num = int(m_name.group(1))
        if num == 33:
            return "3"
        if 1 <= num <= 25:
            return str(num)
    return ""


def parse_kartlist_log(karas_dir: str):
    global KARTLIST_NAME_TO_NUM
    KARTLIST_NAME_TO_NUM.clear()
    log_candidates = [
        os.path.join(karas_dir, "Kartlist.Log"),
        os.path.join(karas_dir, "Kartlist.txt"),
        os.path.join(karas_dir, "kartlist.log"),
    ]
    records = []
    for path in log_candidates:
        if not os.path.exists(path):
            continue
        try:
            raw_text = open(path, "rb").read().decode("cp850", errors="replace")
            blocks = re.split(r"\n\s*Nr\.:\s*", raw_text)
            for idx, b in enumerate(blocks[1:], 1):
                m_nr = re.match(r"([^\s]+)\s+Name:\s*(.+?)\s+Eigt\.:", b)
                m_fid = re.search(r"Funk-ID:\s*([0-9A-Fa-f]+)", b)
                if not m_nr:
                    continue
                raw_nr = m_nr.group(1).strip()
                raw_name = m_nr.group(2).strip()
                funk_id = m_fid.group(1).strip().upper() if m_fid else ""
                norm_num = normalize_kart_number(raw_nr, raw_name, funk_id)
                if norm_num:
                    KARTLIST_NAME_TO_NUM[raw_name.lower()] = (norm_num, raw_nr, raw_name)
                    records.append((idx, raw_nr, raw_name, funk_id, norm_num))
            if records:
                break
        except Exception:
            pass
    return records


def scan_binary_for_kart_mappings(data: bytes):
    found = {}
    pattern = re.compile(rb"(?:Sodi|Black\s*\d)[^\x00\r\n]{0,35}", re.IGNORECASE)
    for m in pattern.finditer(data):
        pos = m.start()
        if pos < 32:
            continue
        name_str = m.group(0).decode("cp850", errors="ignore").strip()
        trans_id = data[pos - 32]
        if trans_id == 0 or trans_id > 250:
            continue
        key = name_str.lower()
        if key in KARTLIST_NAME_TO_NUM:
            norm_num, raw_nr, _ = KARTLIST_NAME_TO_NUM[key]
            if trans_id in BASE_TRANSPONDER_TABLE:
                norm_num = BASE_TRANSPONDER_TABLE[trans_id][0]
            found[trans_id] = (norm_num, f"{name_str} [Nr. {raw_nr}]")
        else:
            norm_num = normalize_kart_number("", name_str)
            if norm_num:
                found[trans_id] = (norm_num, name_str)
    return found


def load_transponder_mappings(karas_dir: str):
    global TRANSPONDER_TO_KART, TRANSPONDER_LABELS
    kartlist_records = parse_kartlist_log(karas_dir)
    for t_id, (k_num, label) in BASE_TRANSPONDER_TABLE.items():
        TRANSPONDER_TO_KART[t_id] = k_num
        TRANSPONDER_LABELS[t_id] = label

    re_files = (
        glob.glob(os.path.join(karas_dir, "RE*.dat")) +
        glob.glob(os.path.join(karas_dir, "RE*.DAT"))
    )
    re_files.sort(key=os.path.getmtime)
    for rf in re_files:
        try:
            raw = open(rf, "rb").read()
            for t_id, (k_num, label) in scan_binary_for_kart_mappings(raw).items():
                TRANSPONDER_TO_KART[t_id] = k_num
                TRANSPONDER_LABELS[t_id] = label
        except Exception:
            pass

    with state_lock:
        bridge_state["transponder_map"] = {
            f"0x{k:02x}": f"Kart {v} ({TRANSPONDER_LABELS.get(k, '')})"
            for k, v in sorted(TRANSPONDER_TO_KART.items())
        }

    print(
        f"[HR-RaceMaster Bridge v31] {len(kartlist_records)} Einträge aus Kartlist.Log & "
        f"{len(TRANSPONDER_TO_KART)} Transponder-IDs (inkl. Ersatztransponder) aktiv."
    )


def get_latest_re_file(directory: str):
    files = (
        glob.glob(os.path.join(directory, "RE*.dat")) +
        glob.glob(os.path.join(directory, "RE*.DAT"))
    )
    return max(files, key=os.path.getmtime) if files else None


def reset_heat_stats(wait_for_new_start: bool = True):
    global waiting_for_new_start, seen_counter
    with state_lock:
        bridge_state["karts"] = {}
        bridge_state["last_raw_packets"] = []
        bridge_state["race_active"] = False
        bridge_state["updated_at"] = time.time()
        waiting_for_new_start = wait_for_new_start
        seen_counter = 0


def parse_16byte_lap_packet(packet: bytes):
    if len(packet) != 16:
        return None, 0, None, False, ""
    if packet.startswith(b'\x01\x00\x00\x00') or packet.startswith(b'\x02\x00\x00\x00'):
        return None, 0, None, False, ""

    trans_id = packet[0]
    crossing_num, total_cs, lap_cs = struct.unpack("<III", packet[4:16])

    if trans_id == 0 or not (1 <= crossing_num <= 500) or total_cs == 0:
        return None, 0, None, False, ""

    if trans_id in TRANSPONDER_TO_KART:
        kart_str = str(TRANSPONDER_TO_KART[trans_id])
        label = TRANSPONDER_LABELS.get(trans_id, f"0x{trans_id:02x}")
    elif 1 <= trans_id <= 25:
        kart_str = str(trans_id)
        label = f"Direkt-ID {trans_id}"
    else:
        kart_str = str(trans_id)
        label = f"Transponder 0x{trans_id:02x}"

    lap_sec = round(lap_cs / 100.0, 3)

    if crossing_num == 1:
        return kart_str, 0, lap_sec, True, label

    if not (100 <= lap_cs <= 30000):
        return None, 0, None, False, ""

    completed_laps = crossing_num - 1
    return kart_str, completed_laps, lap_sec, False, label


def record_lap(kart_str: str, completed_laps: int, lap_sec: float, is_first_crossing: bool):
    global waiting_for_new_start, seen_counter
    with state_lock:
        if waiting_for_new_start:
            if is_first_crossing or completed_laps == 1:
                waiting_for_new_start = False
            else:
                return False

        if not bridge_state["race_active"]:
            bridge_state["race_active"] = True
            bridge_state["start_seq"] += 1

        karts = bridge_state["karts"]
        if is_first_crossing:
            if kart_str not in karts:
                seen_counter += 1
                karts[kart_str] = {
                    "active": True,
                    "first_seen": seen_counter,
                    "best_lap": 0.0,
                    "last_lap": 0.0,
                    "laps": 0
                }
        else:
            if kart_str not in karts or not karts[kart_str]["best_lap"]:
                seen_counter += 1
                karts[kart_str] = {
                    "active": True,
                    "first_seen": karts.get(kart_str, {}).get("first_seen", seen_counter),
                    "best_lap": lap_sec,
                    "last_lap": lap_sec,
                    "laps": 1 if completed_laps > 1 and kart_str not in karts else completed_laps
                }
            else:
                entry = karts[kart_str]
                entry["active"] = True
                entry["laps"] = max(entry["laps"] + 1, completed_laps)
                entry["last_lap"] = lap_sec
                if lap_sec < entry["best_lap"] or entry["best_lap"] <= 0:
                    entry["best_lap"] = lap_sec

        bridge_state["updated_at"] = time.time()
        return True


def is_karas_stop_chunk(chunk: bytes) -> bool:
    chunk_len = len(chunk)
    if chunk_len == 0 or chunk_len >= 4000:
        return False
    if chunk_len % 16 != 0:
        return True
    if chunk.startswith(b'\x01\x00\x00\x00') or chunk.startswith(b'\x02\x00\x00\x00'):
        return True
    return False


def watcher_loop(karas_dir: str):
    global waiting_for_new_start
    current_file = None
    file_pos = 0

    print(f"[HR-RaceMaster Bridge v31] Überwache KaRaS-Ordner: {karas_dir}")

    while True:
        try:
            latest_file = get_latest_re_file(karas_dir)

            if latest_file != current_file:
                current_file = latest_file
                if current_file and os.path.exists(current_file):
                    with open(current_file, "rb") as f:
                        raw_all = f.read()
                        for t_id, (k_num, label) in scan_binary_for_kart_mappings(raw_all).items():
                            TRANSPONDER_TO_KART[t_id] = k_num
                            TRANSPONDER_LABELS[t_id] = label
                        file_pos = f.tell()
                    with state_lock:
                        bridge_state["current_file"] = os.path.basename(current_file)
                    print(f"[i] Aktive Tagesdatei: {os.path.basename(current_file)} (Start-Offset {file_pos})")
                else:
                    file_pos = 0

            if current_file and os.path.exists(current_file):
                with open(current_file, "rb") as f:
                    f.seek(file_pos)
                    chunk = f.read()

                if chunk:
                    chunk_len = len(chunk)
                    now = time.time()

                    if chunk_len >= 4000:
                        parse_kartlist_log(karas_dir)
                        for t_id, (k_num, label) in scan_binary_for_kart_mappings(chunk).items():
                            TRANSPONDER_TO_KART[t_id] = k_num
                            TRANSPONDER_LABELS[t_id] = label

                        file_pos += chunk_len
                        reset_heat_stats(wait_for_new_start=False)
                        with state_lock:
                            bridge_state["race_active"] = True
                            bridge_state["start_seq"] += 1
                            bridge_state["updated_at"] = now
                        print(f"\n🟢 [!] RENNSTART ERKANNT! ({chunk_len} Bytes Startblock)")

                    elif is_karas_stop_chunk(chunk):
                        file_pos += chunk_len
                        with state_lock:
                            if bridge_state["race_active"]:
                                bridge_state["stop_seq"] += 1
                            bridge_state["race_active"] = False
                            bridge_state["updated_at"] = now
                            waiting_for_new_start = True
                        print(f"\n🏁 [!] RENNENDE / STOPP ERKANNT! ({chunk_len} Bytes Signal)")

                    elif chunk_len >= 16 and chunk_len % 16 == 0:
                        for i in range(0, chunk_len, 16):
                            pkt = chunk[i:i + 16]
                            hex_line = pkt.hex(" ")
                            with state_lock:
                                bridge_state["last_raw_packets"].append(hex_line)
                                bridge_state["last_raw_packets"] = bridge_state["last_raw_packets"][-20:]

                            kart_str, laps, lap_sec, is_first, label = parse_16byte_lap_packet(pkt)
                            if kart_str is not None:
                                accepted = record_lap(kart_str, laps, lap_sec, is_first)
                                if accepted:
                                    if is_first:
                                        print(f"  🟢 [Transponder Aktiv] Kart {kart_str:2s} ({label}) -> Im Live-Board eingeblendet!")
                                    else:
                                        print(f"  ⏱️  [Runde erfasst]     Kart {kart_str:2s} ({label}) | Runde {laps:2d} | Zeit: {lap_sec:6.2f} s")

                        file_pos += chunk_len

            time.sleep(0.05)
        except Exception as e:
            time.sleep(0.1)


class BridgeHTTPRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Connection", "close")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/status"):
            with state_lock:
                payload = json.dumps(bridge_state).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()

    def do_POST(self):
        if self.path.startswith("/reset"):
            reset_heat_stats(wait_for_new_start=True)
            with state_lock:
                payload = json.dumps({
                    "status": "reset_ok",
                    "start_seq": bridge_state["start_seq"],
                    "stop_seq": bridge_state["stop_seq"],
                }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(payload)
        elif self.path.startswith("/manual_start"):
            reset_heat_stats(wait_for_new_start=False)
            with state_lock:
                bridge_state["race_active"] = True
                bridge_state["start_seq"] += 1
                payload = json.dumps({
                    "status": "manual_start_ok",
                    "start_seq": bridge_state["start_seq"],
                    "stop_seq": bridge_state["stop_seq"],
                }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(payload)
        else:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HR-RaceMaster KaRaS Live Bridge v31")
    parser.add_argument("--dir", default=KARAS_DIR, help="Pfad zum KaRaS-Verzeichnis")
    parser.add_argument("--port", type=int, default=PORT, help="HTTP-Port (Standard: 8080)")
    args = parser.parse_args()

    stop_old_bridge_instances()
    load_transponder_mappings(args.dir)

    t = threading.Thread(target=watcher_loop, args=(args.dir,), daemon=True)
    t.start()

    server = ReusableThreadingHTTPServer(("0.0.0.0", args.port), BridgeHTTPRequestHandler)
    print(f"[HR-RaceMaster Bridge v31] API läuft auf http://0.0.0.0:{args.port}/status")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[HR-RaceMaster Bridge] Beendet.")