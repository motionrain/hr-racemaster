// src/components/HelpUpdateModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  X,
  RefreshCw,
  Download,
  ExternalLink,
  Mail,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface HelpUpdateModalProps {
  open: boolean;
  onClose: () => void;
  autoCheckOnOpen?: boolean;
}

interface UpdateStatusData {
  platform?: string;
  currentVersion: string;
  latestVersion: string;
  localCommit: string;
  remoteCommit: string;
  behindCount: number;
  commitMessage: string;
  updateAvailable: boolean;
  hasGitDir: boolean;
  readmeUrl: string;
  repoUrl: string;
  checkedAt: string;
}

export default function HelpUpdateModal({
  open,
  onClose,
  autoCheckOnOpen = false,
}: HelpUpdateModalProps) {
  const [checking, setChecking] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);
  const [statusData, setStatusData] = useState<UpdateStatusData | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    setUpdateFeedback(null);
    try {
      const res = await fetch('/api/update', { cache: 'no-store' });
      if (!res.ok) throw new Error('Update-Prüfung fehlgeschlagen');
      const data: UpdateStatusData = await res.json();
      setStatusData(data);
    } catch {
      setUpdateFeedback({
        ok: false,
        text: 'GitHub konnte nicht erreicht werden (bitte Internetverbindung prüfen).',
      });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      checkForUpdates();
    }
  }, [open, autoCheckOnOpen, checkForUpdates]);

  useEffect(() => {
    if (reloadCountdown === null) return;
    if (reloadCountdown <= 0) {
      window.location.reload();
      return;
    }
    const timer = setTimeout(() => {
      setReloadCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [reloadCountdown]);

  const handleInstallUpdate = async () => {
    setUpdating(true);
    setUpdateFeedback(null);
    try {
      const res = await fetch('/api/update', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        const waitSeconds = data.rebuildingProduction ? 12 : 3;
        setUpdateFeedback({
          ok: true,
          text:
            data.message ||
            'Neueste Version wurde vollautomatisch installiert!',
        });
        setReloadCountdown(waitSeconds);
        await checkForUpdates();
      } else {
        setUpdateFeedback({
          ok: false,
          text:
            data.message ||
            'Update konnte nicht automatisch installiert werden.',
        });
      }
    } catch {
      setUpdateFeedback({
        ok: false,
        text: 'Fehler beim Abgleich mit GitHub.',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!open) return null;

  const versionLabel = statusData?.currentVersion || '1.3.0';
  const readmeUrl =
    statusData?.readmeUrl ||
    'https://github.com/motionrain/hr-racemaster/blob/main/README.md';
  const repoUrl =
    statusData?.repoUrl || 'https://github.com/motionrain/hr-racemaster';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] border-2 border-amber-500 rounded-2xl p-6 max-w-lg w-full text-[#FAFAFA] shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titelzeile */}
        <div className="flex items-center justify-between border-b border-[#272727] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-black shadow">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">
                  HR-RaceMaster • Hilfe & Info
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-black">
                  v{versionLabel} (Bridge v31)
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Offizielles Kartbahn-Event-, KartRolling- & KaRaS-Timing-System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#272727] hover:bg-[#404040] text-neutral-300 transition"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entwickler- & Kontakt-Box */}
        <div className="bg-[#272727] border border-[#404040] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-neutral-400 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-500" />
              Software-Entwicklung & Urheberrecht
            </span>
            <span className="text-xs font-mono text-neutral-400">
              System: {statusData?.platform || 'Linux Mint / Windows'}
            </span>
          </div>

          <div className="text-base font-black text-white">
            Entwickler: © Hans Richter
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-neutral-300">Kontakt:</span>
            <a
              href="mailto:hgr3dsm@googlemail.com?subject=HR-RaceMaster%20Feedback%20%2F%20Bug-Meldung"
              className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs hover:bg-amber-500/25 transition"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              hgr3dsm@googlemail.com
            </a>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed pt-1 border-t border-[#404040]">
            Melden Sie sich bei Fehler- oder Bug-Sichtung, oder für
            Verbesserungsvorschläge.
          </p>
        </div>

        {/* Link zur GitHub README.md Dokumentation */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#272727]/70 border border-[#404040] rounded-xl p-3.5">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs font-black uppercase text-white">
                Dokumentation & Anleitung (GitHub)
              </div>
              <div className="text-[11px] text-neutral-400">
                Vollständige README.md mit Setup-, KaRaS- und System-Befehlen
              </div>
            </div>
          </div>

          <a
            href={readmeUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            GitHub README.md öffnen
          </a>
        </div>

        {/* Vollautomatischer Update-Bereich für Windows & Linux Mint */}
        <div className="bg-[#272727] border border-[#404040] rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase text-amber-400 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Vollautomatisches Update (Windows & Linux Mint)
              </div>
              <div className="text-[11px] text-neutral-400">
                Gleicht direkt mit{' '}
                <span className="font-mono text-neutral-300">
                  motionrain/hr-racemaster
                </span>{' '}
                ab (funktioniert mit Git & mit ZIP-Ordnern)
              </div>
            </div>

            <button
              type="button"
              onClick={checkForUpdates}
              disabled={checking || updating}
              className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-black border border-amber-500/50 text-amber-400 font-black text-xs flex items-center transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${checking ? 'animate-spin' : ''}`}
              />
              {checking ? 'Prüfe GitHub...' : 'Check for Updates'}
            </button>
          </div>

          {statusData && (
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#404040] text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-neutral-400">
                  Installiert:{' '}
                  <strong className="text-white font-mono">
                    v{statusData.currentVersion} ({statusData.localCommit})
                  </strong>
                </span>
                <span className="text-neutral-400">
                  GitHub (main):{' '}
                  <strong className="text-amber-400 font-mono">
                    v{statusData.latestVersion} ({statusData.remoteCommit})
                  </strong>
                </span>
              </div>

              <div className="pt-2 border-t border-[#272727] flex flex-wrap items-center justify-between gap-2">
                {statusData.updateAvailable ? (
                  <div className="text-amber-400 font-bold flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                    <span>
                      Update verfügbar: {statusData.commitMessage}
                    </span>
                  </div>
                ) : (
                  <div className="text-emerald-400 font-bold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                    <span>System ist auf dem neuesten Stand ({statusData.checkedAt})</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleInstallUpdate}
                  disabled={updating}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center shadow transition disabled:opacity-50 ${
                    statusData.updateAvailable
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black animate-pulse'
                      : 'bg-[#272727] hover:bg-[#404040] text-neutral-200 border border-[#404040]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {updating
                    ? 'Installiere Update & kompiliere...'
                    : statusData.updateAvailable
                    ? 'Jetzt vollautomatisch aktualisieren'
                    : 'Trotzdem von GitHub neu synchronisieren'}
                </button>
              </div>
            </div>
          )}

          {updateFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                updateFeedback.ok
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{updateFeedback.text}</span>
              {reloadCountdown !== null && (
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500 text-black font-mono font-black shrink-0">
                  Reload in {reloadCountdown}s
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fußzeile */}
        <div className="flex items-center justify-between pt-2 border-t border-[#272727]">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-neutral-400 hover:text-amber-400 flex items-center transition"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            github.com/motionrain/hr-racemaster
          </a>

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
