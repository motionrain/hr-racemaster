// src/components/HelpUpdateModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Image as ImageIcon,
  Upload,
  Trash2,
  FolderArchive,
} from 'lucide-react';

interface HelpUpdateModalProps {
  open: boolean;
  onClose: () => void;
  autoCheckOnOpen?: boolean;
  customLogo: string;
  onChangeCustomLogo: (dataUrl: string) => void;
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
  customLogo,
  onChangeCustomLogo,
}: HelpUpdateModalProps) {
  const [checking, setChecking] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);
  const [statusData, setStatusData] = useState<UpdateStatusData | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [logoFeedback, setLogoFeedback] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/update', { cache: 'no-store' });
      if (!res.ok) throw new Error('Offline');
      const data: UpdateStatusData = await res.json();
      setStatusData(data);
    } catch {
      // Offline – kein Fehlerbanner nötig, da Offline-ZIP bereitsteht
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLogoFeedback('');
      setUpdateFeedback(null);
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

  // A) Online-Update über GitHub
  const handleInstallOnlineUpdate = async () => {
    setUpdating(true);
    setUpdateFeedback(null);
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'online' }),
      });
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
            'Online-Update nicht möglich. Nutze unten das Offline-ZIP Drag & Drop Feld!',
        });
      }
    } catch {
      setUpdateFeedback({
        ok: false,
        text: 'Keine Internetverbindung – ziehe einfach eine ZIP-Datei in das Offline-Update-Feld unten!',
      });
    } finally {
      setUpdating(false);
    }
  };

  // B) Offline-Update per ZIP-Datei (Drag & Drop oder Dateiauswahl)
  const processOfflineZipFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setUpdateFeedback({
        ok: false,
        text: `Bitte eine gültige .zip Datei hineinziehen ("${file.name}" ist kein ZIP-Archiv).`,
      });
      return;
    }

    setUpdating(true);
    setUpdateFeedback({
      ok: true,
      text: `Entpacke Offline-Update "${file.name}" und aktualisiere System...`,
    });

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64Data = String(ev.target?.result || '');
        const res = await fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'offline_zip',
            filename: file.name,
            zipBase64: base64Data,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          const waitSeconds = data.rebuildingProduction ? 12 : 3;
          setUpdateFeedback({
            ok: true,
            text:
              data.message ||
              `Offline-Update "${file.name}" erfolgreich installiert!`,
          });
          setReloadCountdown(waitSeconds);
          await checkForUpdates();
        } else {
          setUpdateFeedback({
            ok: false,
            text:
              data.message ||
              'Fehler beim Entpacken der ZIP-Datei.',
          });
        }
      } catch {
        setUpdateFeedback({
          ok: false,
          text: 'Fehler beim Übertragen der Offline-ZIP-Datei an den lokalen Server.',
        });
      } finally {
        setUpdating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processOfflineZipFile(file);
    }
  };

  const handleZipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processOfflineZipFile(file);
    }
    e.target.value = '';
  };

  // C) Logo-Upload (für Header, alle A4-Ausdrucke & Sieger-Urkunde)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const resultStr = String(ev.target?.result || '');
      if (!resultStr.startsWith('data:image/')) {
        setLogoFeedback('Bitte eine gültige Bilddatei (PNG, JPG, SVG, WebP) wählen.');
        return;
      }

      if (resultStr.startsWith('data:image/svg')) {
        onChangeCustomLogo(resultStr);
        setLogoFeedback('✓ Logo gespeichert (sichtbar im Header, A4-Ausdruck & Urkunde)!');
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const maxW = 600;
        const maxH = 240;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        if (h > maxH) {
          w = Math.round((w * maxH) / h);
          h = maxH;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const optimized = canvas.toDataURL('image/png');
          onChangeCustomLogo(optimized);
          setLogoFeedback('✓ Logo gespeichert (sichtbar im Header, A4-Ausdruck & Urkunde)!');
        } else {
          onChangeCustomLogo(resultStr);
          setLogoFeedback('✓ Logo erfolgreich gespeichert!');
        }
      };
      img.onerror = () => {
        onChangeCustomLogo(resultStr);
        setLogoFeedback('✓ Logo erfolgreich gespeichert!');
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    onChangeCustomLogo('');
    setLogoFeedback('Logo entfernt – Standard-Icon wieder aktiv.');
  };

  if (!open) return null;

  const versionLabel = statusData?.currentVersion || '1.6.0';
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
        className="bg-[#1A1A1A] border-2 border-amber-500 rounded-2xl p-6 max-w-2xl w-full text-[#FAFAFA] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
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
                  HR-RaceMaster • Hilfe, Logo & Update
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

        {/* 1. Eigenes Logo hochladen (Header, A4-Ausdrucke & Sieger-Urkunde) */}
        <div className="bg-[#272727] border-2 border-amber-500/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-black uppercase text-amber-400 flex items-center">
            <ImageIcon className="w-4 h-4 mr-1.5" />
            1. Eigenes Logo (Header, alle A4-Ausdrucke & Sieger-Urkunde)
          </div>
          <p className="text-[11px] text-neutral-300">
            Lade hier dein Bahn-, Vereins- oder Event-Logo (PNG, JPG, SVG) hoch. Es wird sofort oben links im Header sowie auf allen A4-Wertungslisten und auf der A4-Sieger-Urkunde abgedruckt:
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {customLogo ? (
              <div className="flex items-center space-x-3 bg-white px-3.5 py-2 rounded-xl border border-neutral-300 shadow">
                <img
                  src={customLogo}
                  alt="Aktuelles Logo"
                  className="h-12 w-auto max-w-[190px] object-contain"
                />
              </div>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-[#1A1A1A] border border-dashed border-[#404040] text-xs text-neutral-400">
                Noch kein eigenes Logo gewählt (Standard-Icon aktiv)
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow transition"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {customLogo ? 'Logo ändern' : 'Logo hochladen'}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoFileChange}
                className="hidden"
              />

              {customLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center transition"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Entfernen
                </button>
              )}
            </div>
          </div>

          {logoFeedback && (
            <div className="text-xs font-bold text-emerald-400 pt-1">
              {logoFeedback}
            </div>
          )}
        </div>

        {/* 2. Software-Update: Sowohl Offline per ZIP Drag & Drop als auch Online über GitHub */}
        <div className="bg-[#272727] border border-[#404040] rounded-xl p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase text-amber-400 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5" />
                2. Software-Update (Offline per ZIP Drag & Drop oder Online via GitHub)
              </div>
              <div className="text-[11px] text-neutral-400">
                Funktioniert auf der Bahn komplett ohne Internet (ZIP hineinziehen) oder online per GitHub
              </div>
            </div>

            <button
              type="button"
              onClick={checkForUpdates}
              disabled={checking || updating}
              className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-black border border-amber-500/50 text-amber-400 font-black text-xs flex items-center transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${checking ? 'animate-spin' : ''}`}
              />
              {checking ? 'Prüfe...' : 'Check for Updates'}
            </button>
          </div>

          {/* DRAG & DROP FELD FÜR OFFLINE ZIP-UPDATES */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !updating && zipInputRef.current?.click()}
            className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition ${
              dragActive
                ? 'border-emerald-400 bg-emerald-500/20 scale-[1.01]'
                : 'border-amber-500/50 bg-[#1A1A1A] hover:border-amber-400 hover:bg-black/40'
            }`}
          >
            <FolderArchive
              className={`w-8 h-8 mx-auto mb-1.5 ${
                dragActive ? 'text-emerald-400 animate-bounce' : 'text-amber-500'
              }`}
            />
            <div className="text-xs sm:text-sm font-black text-white">
              📦 Offline-Update: ZIP-Datei hierher ziehen (Drag & Drop)
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Ziehe eine <span className="font-mono text-amber-400">hr-racemaster-vX.zip</span> direkt in dieses Feld oder klicke hier, um die ZIP-Datei vom USB-Stick / PC auszuwählen.
            </p>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleZipInputChange}
              className="hidden"
            />
          </div>

          {/* Online GitHub Status & 1-Klick Online-Button */}
          {statusData && (
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#404040] text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-neutral-400 mr-3">
                  Installiert:{' '}
                  <strong className="text-white font-mono">
                    v{statusData.currentVersion} ({statusData.localCommit})
                  </strong>
                </span>
                <span className="text-neutral-400">
                  GitHub:{' '}
                  <strong className="text-amber-400 font-mono">
                    v{statusData.latestVersion} ({statusData.remoteCommit})
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleInstallOnlineUpdate}
                disabled={updating}
                className={`px-3 py-1.5 rounded-lg font-black text-xs flex items-center shadow transition disabled:opacity-50 ${
                  statusData.updateAvailable
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-[#272727] hover:bg-[#404040] text-neutral-200 border border-[#404040]'
                }`}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {updating ? 'Aktualisiere...' : 'Online von GitHub laden'}
              </button>
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

        {/* 3. Entwickler- & Kontakt-Box */}
        <div className="bg-[#272727] border border-[#404040] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-neutral-400 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-500" />
              Entwickler & Kontakt
            </span>
            <span className="text-xs font-mono text-neutral-400">
              System: {statusData?.platform || 'Linux Mint / Windows'}
            </span>
          </div>

          <div className="text-sm sm:text-base font-black text-white">
            Entwickler: © Hans Richter
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="font-bold text-neutral-300">Kontakt:</span>
            <a
              href="mailto:hgr3dsm@googlemail.com?subject=HR-RaceMaster%20Feedback%20%2F%20Bug-Meldung"
              className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs hover:bg-amber-500/25 transition"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              hgr3dsm@googlemail.com
            </a>
          </div>

          <p className="text-xs text-neutral-300 pt-1 border-t border-[#404040]">
            Melden Sie sich bei Fehler- oder Bug-Sichtung, oder für
            Verbesserungsvorschläge.
          </p>
        </div>

        {/* Fußzeile mit Link zur GitHub README.md */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#272727]">
          <a
            href={readmeUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#272727] hover:bg-[#404040] border border-[#404040] text-amber-400 font-black text-xs flex items-center transition"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            GitHub README.md öffnen
            <ExternalLink className="w-3 h-3 ml-1.5 opacity-70" />
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
