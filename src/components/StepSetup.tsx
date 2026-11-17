// src/components/StepSetup.tsx
import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Users,
  Wrench,
  Play,
  ShieldAlert,
  Minus,
  Plus,
  Grid,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { EventMode, FleetType, KartItem, RaceGroup } from '../types/kart';

interface StepSetupProps {
  darkMode: boolean;
  eventName: string;
  setEventName: (v: string) => void;
  eventMode: EventMode;
  setEventMode: (m: EventMode) => void;
  hasWarmup: boolean;
  setHasWarmup: (v: boolean) => void;
  gpQualiCount: number;
  setGpQualiCount: (n: number) => void;
  maxTrackKarts: number;
  setMaxTrackKarts: (n: number) => void;
  fleetType: FleetType;
  onFleetChange: (t: FleetType) => void;
  karts: KartItem[];
  onToggleKart: (id: number) => void;
  rawDriversText: string;
  setRawDriversText: (v: string) => void;
  groups: RaceGroup[];
  onInitializeSessions: () => void;
  onOpenRotationBoard: () => void;
  mobileUrl?: string;
  mainUrl?: string;
}

export default function StepSetup({
  darkMode,
  eventName,
  setEventName,
  eventMode,
  setEventMode,
  hasWarmup,
  setHasWarmup,
  gpQualiCount,
  setGpQualiCount,
  maxTrackKarts,
  setMaxTrackKarts,
  fleetType,
  onFleetChange,
  karts,
  onToggleKart,
  rawDriversText,
  setRawDriversText,
  groups,
  onInitializeSessions,
  onOpenRotationBoard,
  mobileUrl = 'http://localhost:3000/mobile',
  mainUrl = 'http://localhost:3000',
}: StepSetupProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  const activeKartsCount = karts.filter((k) => k.active).length;

  const handleMaxKartsChange = (val: number) => {
    const clamped = Math.max(1, Math.min(25, val || 1));
    setMaxTrackKarts(clamped);
  };

  const handleCopyMobileUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Event-Art wählen */}
        <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
          <h2 className="text-lg font-black mb-4">1. Veranstaltungstyp wählen</h2>

          <div className="mb-4">
            <label className="block text-xs font-bold uppercase opacity-70 mb-1">
              Event-Bezeichnung
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border font-bold ${subBg}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setEventMode('gp')}
              className={`p-4 rounded-xl border text-left transition ${
                eventMode === 'gp'
                  ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40'
                  : subBg
              }`}
            >
              <div className="font-black text-base mb-1">🏆 1. GP Rennen</div>
              <p className="text-xs opacity-75">
                Optionales Warm-up, 1 bis 5 Qualifyings & Finalläufe (A/B/C) nach Rundenanzahl.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEventMode('rolling')}
              className={`p-4 rounded-xl border text-left transition ${
                eventMode === 'rolling'
                  ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40'
                  : subBg
              }`}
            >
              <div className="font-black text-base mb-1">🔄 2. KartRolling</div>
              <p className="text-xs opacity-75">
                Jeder fährt mit jedem Kart! Faire Gesamtzeit-Wertung über alle Läufe + Finalläufe.
              </p>
            </button>
          </div>

          {/* Optionen */}
          <div className="space-y-4 pt-4 border-t border-[#535353]/30 text-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-bold">Warm-up vor dem Qualifying fahren?</span>
              <input
                type="checkbox"
                checked={hasWarmup}
                onChange={(e) => setHasWarmup(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded"
              />
            </label>

            {eventMode === 'gp' && (
              <div className="flex items-center justify-between">
                <span className="font-bold">Anzahl Qualifikations-Läufe:</span>
                <div className="flex space-x-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGpQualiCount(num)}
                      className={`px-3 py-1 rounded-md font-bold text-xs ${
                        gpQualiCount === num ? 'bg-amber-500 text-black' : subBg
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frei einstellbare Max. Streckenbelegung pro Gruppe */}
            <div className="pt-2 border-t border-[#535353]/20">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-bold block">Max. Streckenbelegung pro Gruppe:</span>
                  <span className="text-xs opacity-65">
                    Frei wählbar (z. B. 6, 7, 8, 9, 10 oder 12 Karts gleichzeitig)
                  </span>
                </div>

                {/* Numerische Eingabe mit +/- Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleMaxKartsChange(maxTrackKarts - 1)}
                    className={`p-2 rounded-lg border hover:border-amber-500 transition ${subBg}`}
                    title="1 Kart weniger"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={maxTrackKarts}
                    onChange={(e) => handleMaxKartsChange(parseInt(e.target.value, 10))}
                    className={`w-16 px-2 py-1.5 rounded-lg border text-center font-mono font-black text-base focus:outline-none focus:border-amber-500 ${subBg}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleMaxKartsChange(maxTrackKarts + 1)}
                    className={`p-2 rounded-lg border hover:border-amber-500 transition ${subBg}`}
                    title="1 Kart mehr"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Schnellwahl-Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs opacity-65 mr-1">Schnellwahl:</span>
                {[6, 7, 8, 9, 10, 12].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleMaxKartsChange(preset)}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs border transition ${
                      maxTrackKarts === preset
                        ? 'bg-amber-500 text-black border-amber-500 shadow'
                        : subBg
                    }`}
                  >
                    Max. {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleMaxKartsChange(activeKartsCount)}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs border transition ${
                    maxTrackKarts === activeKartsCount
                      ? 'bg-amber-500 text-black border-amber-500 shadow'
                      : subBg
                  }`}
                >
                  Alle Aktiven ({activeKartsCount})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Kart-Selektion (Fährt / Defekt) */}
        <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-black flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-amber-500" />
              2. Karts selektieren ({activeKartsCount} bereit)
            </h2>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => onFleetChange('adult')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  fleetType === 'adult' ? 'bg-amber-500 text-black' : subBg
                }`}
              >
                Erwachsene (1–14)
              </button>
              <button
                type="button"
                onClick={() => onFleetChange('junior')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  fleetType === 'junior' ? 'bg-amber-500 text-black' : subBg
                }`}
              >
                Kinder (1–8)
              </button>
            </div>
          </div>

          <p className="text-xs opacity-70 mb-3">
            Klicke auf ein Kart, um es als <strong>Defekt / Gesperrt</strong> zu markieren. Es wird automatisch in allen Gruppen übersprungen:
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
            {karts.map((kart) => (
              <button
                key={kart.id}
                type="button"
                onClick={() => onToggleKart(kart.id)}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  kart.active
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold'
                    : 'bg-rose-500/15 border-rose-500 text-rose-500 line-through opacity-60'
                }`}
              >
                <span className="text-xs font-black">{kart.name}</span>
                <span className="text-[10px] mt-0.5 flex items-center">
                  {kart.active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Fährt
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-0.5" /> Defekt
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>

          {fleetType === 'adult' && (
            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#535353]/30">
              <span className="opacity-75 flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1 text-amber-500" />
                Schnell-Aktion bei Aberglaube:
              </span>
              <button
                type="button"
                onClick={() => onToggleKart(13)}
                className={`px-3 py-1 rounded-lg font-bold border ${subBg}`}
              >
                Kart 13 {karts.find((k) => k.id === 13)?.active ? 'sperren' : 'freigeben'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Fahrerliste + Smartphone WLAN Live-Check-In */}
      <div className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
        {/* Smartphone WLAN Info-Banner */}
        <div
          className={`mb-5 p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${subBg}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-black">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase text-amber-500">
                  📱 Smartphone Fahrer-Erfassung (WLAN Live-Sync)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  ● Automatische Übertragung aktiv
                </span>
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                Öffne am Smartphone im selben WLAN:{' '}
                <strong className="font-mono text-amber-400">{mobileUrl}</strong>{' '}
                (Hauptseite für Tablets: <span className="font-mono">{mainUrl}</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyMobileUrl}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center hover:bg-amber-500/25 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Link kopiert
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Smartphone-Link kopieren
                </>
              )}
            </button>
            <a
              href="/mobile"
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center hover:border-amber-500 transition ${subBg}`}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Vorschau (/mobile)
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-black mb-2 flex items-center">
              <Users className="w-5 h-5 mr-2 text-amber-500" />
              3. Fahrer eintragen (PC oder live per Smartphone)
            </h2>
            <textarea
              rows={8}
              value={rawDriversText}
              onChange={(e) => setRawDriversText(e.target.value)}
              placeholder="Fahrernamen untereinander einfügen oder am Smartphone unter /mobile eingeben..."
              className={`w-full p-3 rounded-xl border font-mono text-sm ${subBg}`}
            />
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black mb-2">
                Automatische Gruppeneinteilung ({groups.length} Gruppen • Max.{' '}
                {Math.min(maxTrackKarts, activeKartsCount)} pro Gruppe)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {groups.map((g) => (
                  <div key={g.id} className={`p-3 rounded-xl border ${subBg}`}>
                    <div className="font-black text-xs text-amber-500 mb-1 flex justify-between">
                      <span>{g.name}</span>
                      <span>{g.drivers.length} Fahrer</span>
                    </div>
                    <div className="text-xs space-y-0.5 opacity-85">
                      {g.drivers.map((d) => (
                        <div key={d.id}>
                          #{d.id} {d.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onOpenRotationBoard}
                className={`py-3.5 px-4 rounded-xl border font-black text-sm flex items-center justify-center transition hover:border-amber-500 ${subBg}`}
              >
                <Grid className="w-4 h-4 mr-2 text-amber-500" />
                Gesamtansicht / Live-Screen
              </button>

              <button
                type="button"
                onClick={onInitializeSessions}
                className="py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg flex items-center justify-center transition"
              >
                <Play className="w-4 h-4 mr-2 fill-black" />
                Karten neu erzeugen & Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
