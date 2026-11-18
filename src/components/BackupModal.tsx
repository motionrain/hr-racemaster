// src/components/BackupModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
  FolderArchive,
  X,
  HardDrive,
  FileJson,
  Clock,
} from 'lucide-react';
import {
  EventMode,
  FleetType,
  KartItem,
  SessionCard,
} from '../types/kart';

export interface RaceBackupData {
  version: string;
  eventName: string;
  customLogo?: string;
  eventMode: EventMode;
  hasWarmup: boolean;
  gpQualiCount: number;
  maxTrackKarts: number;
  fleetType: FleetType;
  karts: KartItem[];
  rawDriversText: string;
  customGroupKarts: Record<string, string[]>;
  sessionCards: SessionCard[];
  activeCardIndex: number;
  finalCards: SessionCard[];
  activeFinalIndex: number;
  savedAtFormatted?: string;
  savedAtTimestamp?: number;
}

interface SnapshotMeta {
  filename: string;
  eventName: string;
  savedAt: string;
  driverCount: number;
  sizeBytes: number;
}

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
  currentBackupData: RaceBackupData;
  lastAutoSaveTime: string;
  onRestoreBackup: (data: RaceBackupData) => void;
  onResetNewEvent: () => void;
}

export default function BackupModal({
  open,
  onClose,
  currentBackupData,
  lastAutoSaveTime,
  onRestoreBackup,
  onResetNewEvent,
}: BackupModalProps) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [backupDir, setBackupDir] = useState<string>('');
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/backup', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.snapshots)) {
        setSnapshots(data.snapshots);
      }
      if (data.backupDir) {
        setBackupDir(data.backupDir);
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setFeedback(null);
      fetchSnapshots();
    }
  }, [open, fetchSnapshots]);

  if (!open) return null;

  const handleDownloadJsonFile = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
    const cleanName = (currentBackupData.eventName || 'Event')
      .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g, '-')
      .replace(/-+/g, '-');

    const payload: RaceBackupData = {
      ...currentBackupData,
      version: '1.6.0',
      savedAtFormatted: now.toLocaleString('de-DE'),
      savedAtTimestamp: now.getTime(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HR-RaceMaster_${cleanName}_${dateStr}_${timeStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedback({
      ok: true,
      text: `JSON-Backup "${a.download}" wurde heruntergeladen!`,
    });
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        if (!parsed || !Array.isArray(parsed.sessionCards)) {
          throw new Error('Ungültiges Format');
        }
        onRestoreBackup(parsed as RaceBackupData);
        setFeedback({
          ok: true,
          text: `Backup "${file.name}" (${parsed.eventName || 'Event'}) erfolgreich geladen!`,
        });
      } catch {
        setFeedback({
          ok: false,
          text: 'Die gewählte Datei ist kein gültiges HR-RaceMaster JSON-Backup.',
        });
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleCreateServerSnapshot = async () => {
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'snapshot',
          backup: currentBackupData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({
          ok: true,
          text: `Snapshot "${data.filename}" auf der Festplatte gesichert!`,
        });
        fetchSnapshots();
      }
    } catch {
      setFeedback({
        ok: false,
        text: 'Snapshot konnte nicht auf dem Server gespeichert werden.',
      });
    }
  };

  const handleLoadServerSnapshot = async (filename: string) => {
    try {
      const res = await fetch(`/api/backup?file=${encodeURIComponent(filename)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.ok && data.backup) {
        onRestoreBackup(data.backup as RaceBackupData);
        setFeedback({
          ok: true,
          text: `Archiv-Stand "${filename}" erfolgreich wiederhergestellt!`,
        });
      }
    } catch {
      setFeedback({
        ok: false,
        text: 'Fehler beim Laden des Archiv-Backups.',
      });
    }
  };

  const handleDeleteSnapshot = async (filename: string) => {
    if (!window.confirm(`Backup "${filename}" wirklich löschen?`)) return;
    await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', filename }),
    });
    fetchSnapshots();
  };

  const handleStartFreshEvent = async () => {
    if (
      !window.confirm(
        'Neues Event starten? Der aktuelle Stand wird vorher automatisch im Festplatten-Archiv gesichert und danach werden alle gefahrenen Zeiten auf 0 zurückgesetzt.'
      )
    ) {
      return;
    }
    try {
      await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'snapshot',
          backup: currentBackupData,
        }),
      });
    } catch {
      // ignore
    }
    onResetNewEvent();
    onClose();
  };

  const totalLapsRecorded =
    currentBackupData.sessionCards.reduce(
      (sum, c) => sum + c.entries.reduce((s, e) => s + (e.laps || 0), 0),
      0
    ) +
    currentBackupData.finalCards.reduce(
      (sum, c) => sum + c.entries.reduce((s, e) => s + (e.laps || 0), 0),
      0
    );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] border-2 border-amber-500 rounded-2xl p-6 max-w-2xl w-full text-[#FAFAFA] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#272727] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-black shadow">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Backup & Wiederherstellung (JSON)
              </h2>
              <p className="text-xs text-neutral-400">
                Automatische Echtzeit-Sicherung sowie JSON-Export & Import für alle Rennergebnisse
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#272727] hover:bg-[#404040] text-neutral-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Auto-Backup aktiv (Browser & Festplatte) • {currentBackupData.sessionCards.length} Vorläufe,{' '}
              {currentBackupData.finalCards.length} Finalläufe ({totalLapsRecorded} gefahrene Runden)
            </span>
          </div>
          <span className="font-mono text-emerald-400 font-black flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Gesichert: {lastAutoSaveTime || 'Gerade eben'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleDownloadJsonFile}
            className="p-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex flex-col items-center justify-center text-center shadow-lg transition"
          >
            <Download className="w-6 h-6 mb-1.5" />
            <span>Als JSON-Datei speichern</span>
            <span className="text-[10px] font-normal opacity-80 mt-0.5">
              Download auf PC / USB-Stick
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl bg-[#272727] hover:bg-[#404040] border-2 border-amber-500/50 text-amber-400 font-black text-xs flex flex-col items-center justify-center text-center transition"
          >
            <Upload className="w-6 h-6 mb-1.5" />
            <span>JSON-Backup laden</span>
            <span className="text-[10px] font-normal text-neutral-400 mt-0.5">
              .json Datei vom PC öffnen
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJsonFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleCreateServerSnapshot}
            className="p-4 rounded-xl bg-[#272727] hover:bg-[#404040] border border-[#404040] text-emerald-400 font-black text-xs flex flex-col items-center justify-center text-center transition"
          >
            <HardDrive className="w-6 h-6 mb-1.5" />
            <span>Im PC-Archiv merken</span>
            <span className="text-[10px] font-normal text-neutral-400 mt-0.5">
              Schnell-Snapshot auf Festplatte
            </span>
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold ${
              feedback.ok
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="bg-[#272727] border border-[#404040] rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <FolderArchive className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase">
                Gespeicherte Rennen auf diesem PC ({snapshots.length})
              </span>
            </div>
            {backupDir && (
              <span className="text-[10px] font-mono text-neutral-400 truncate max-w-xs">
                Ordner: {backupDir}
              </span>
            )}
          </div>

          {loadingList ? (
            <div className="text-xs text-neutral-400 py-4 text-center">
              Lade gespeicherte Backups...
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-xs text-neutral-400 py-4 text-center border border-dashed border-[#404040] rounded-lg">
              Noch keine manuellen Snapshots im Archiv. Klicke oben auf „Im PC-Archiv merken“, um jederzeit Zwischenstände festzuhalten.
            </div>
          ) : (
            <div className="divide-y divide-[#404040] max-h-48 overflow-y-auto pr-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.filename}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate">
                    <div className="font-bold text-white flex items-center">
                      <FileJson className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" />
                      <span>{snap.eventName}</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-[#1A1A1A] text-amber-400 font-mono text-[10px]">
                        {snap.driverCount} Fahrer
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {snap.savedAt} • {snap.filename}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoadServerSnapshot(snap.filename)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition"
                    >
                      Laden
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSnapshot(snap.filename)}
                      className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-rose-500/20 text-rose-400 transition"
                      title="Snapshot löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#272727]">
          <button
            type="button"
            onClick={handleStartFreshEvent}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center transition"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Neues Event starten (Sichert altes Rennen & setzt Zeiten auf 0)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
