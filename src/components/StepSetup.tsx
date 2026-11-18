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
  QrCode,
  Sparkles,
  Layers,
} from 'lucide-react';
import { EventMode, FleetType, KartItem, RaceGroup } from '../types/kart';
import { QrCodeSvg } from './QrCodeModal';

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
  onToggleJuniorFleetAddon: () => void;
  karts: KartItem[];
  onToggleKart: (id: number) => void;
  rawDriversText: string;
  setRawDriversText: (v: string) => void;
  groups: RaceGroup[];
  onAssignGroupKarts: (groupName: string, karts: string[]) => void;
  onInitializeSessions: () => void;
  onOpenRotationBoard: () => void;
  onOpenQrModal: () => void;
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
  onToggleJuniorFleetAddon,
  karts,
  onToggleKart,
  rawDriversText,
  setRawDriversText,
  groups,
  onAssignGroupKarts,
  onInitializeSessions,
  onOpenRotationBoard,
  onOpenQrModal,
  mobileUrl = 'http://localhost:3000/mobile',
  mainUrl = 'http://localhost:3000',
}: StepSetupProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#292929] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#242424] border-[#3D3D3D] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  const adultKarts = karts.filter(
    (k) => k.category === 'adult' || (!k.category && !k.name.startsWith('Kids'))
  );
  const juniorKarts = karts.filter(
    (k) => k.category === 'junior' || k.name.startsWith('Kids')
  );

  const activeKarts = karts.filter((k) => k.active);
  const activeKartsCount = activeKarts.length;
  const activeAdultCount = adultKarts.filter((k) => k.active).length;
  const activeJuniorCount = juniorKarts.filter((k) => k.active).length;
  const anyJuniorActive = activeJuniorCount > 0;

  const totalDriversCount = rawDriversText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

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

  const handleToggleGroupKart = (group: RaceGroup, kartName: string) => {
    const current = [...group.assignedKarts.slice(0, group.drivers.length)];
    const idx = current.indexOf(kartName);
    if (idx >= 0) {
      if (current.length <= 1) return;
      current.splice(idx, 1);
    } else {
      if (current.length >= group.drivers.length) {
        current.shift();
      }
      current.push(kartName);
    }
    onAssignGroupKarts(group.name, current);
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          OBERE REIHE: 1. EVENT-MODUS & 2. KART-FLOTTE (ERWACHSENE + KINDER KOMBINIERBAR)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Veranstaltungstyp & Streckenbelegung (5 Spalten) */}
        <div className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border shadow-sm ${cardBg}`}>
          <h2 className="text-lg sm:text-xl font-black mb-4 flex items-center">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-black text-sm font-black mr-2.5">
              1
            </span>
            Veranstaltungstyp & Modus
          </h2>

          <div className="mb-4">
            <label className="block text-xs font-bold uppercase opacity-75 mb-1.5">
              Event-Bezeichnung
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border font-black text-base focus:outline-none focus:border-amber-500 ${subBg}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setEventMode('gp')}
              className={`p-4 rounded-xl border text-left transition active:scale-[0.99] ${
                eventMode === 'gp'
                  ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40'
                  : subBg
              }`}
            >
              <div className="font-black text-base mb-1">🏆 GP Rennen</div>
              <p className="text-xs opacity-80 leading-relaxed">
                Warm-up, 1–5 Qualifyings & Finalläufe (C ➔ B ➔ A) nach Rundenanzahl.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEventMode('rolling')}
              className={`p-4 rounded-xl border text-left transition active:scale-[0.99] ${
                eventMode === 'rolling'
                  ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40'
                  : subBg
              }`}
            >
              <div className="font-black text-base mb-1">🔄 KartRolling</div>
              <p className="text-xs opacity-80 leading-relaxed">
                Jeder fährt mit jedem Kart der Gruppe! Faire Gesamtzeit-Wertung + Finale.
              </p>
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#535353]/30 text-sm">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="font-bold">Warm-up vor dem Qualifying fahren?</span>
              <input
                type="checkbox"
                checked={hasWarmup}
                onChange={(e) => setHasWarmup(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </label>

            {eventMode === 'gp' && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">Anzahl Qualifikations-Läufe:</span>
                <div className="flex space-x-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGpQualiCount(num)}
                      className={`px-3.5 py-1.5 rounded-lg font-black text-xs transition ${
                        gpQualiCount === num ? 'bg-amber-500 text-black shadow' : subBg
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#535353]/20">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div>
                  <span className="font-black block text-sm">
                    Max. Karts pro Gruppe auf der Bahn:
                  </span>
                  <span className="text-xs opacity-70">
                    Bestimmt die automatische Gruppengröße (z. B. 6, 7, 8, 10)
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleMaxKartsChange(maxTrackKarts - 1)}
                    className={`p-2.5 rounded-xl border hover:border-amber-500 transition active:scale-95 ${subBg}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={maxTrackKarts}
                    onChange={(e) => handleMaxKartsChange(parseInt(e.target.value, 10))}
                    className={`w-16 px-2 py-2 rounded-xl border text-center font-mono font-black text-lg focus:outline-none focus:border-amber-500 ${subBg}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleMaxKartsChange(maxTrackKarts + 1)}
                    className={`p-2.5 rounded-xl border hover:border-amber-500 transition active:scale-95 ${subBg}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[5, 6, 7, 8, 9, 10, 12].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleMaxKartsChange(preset)}
                    className={`px-3 py-1.5 rounded-lg font-black text-xs border transition ${
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
                  className={`px-3 py-1.5 rounded-lg font-black text-xs border transition ${
                    maxTrackKarts === activeKartsCount
                      ? 'bg-amber-500 text-black border-amber-500 shadow'
                      : subBg
                  }`}
                >
                  Alle ({activeKartsCount})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Kart-Selektion: Erwachsene (1–14) & Kinderkarts (1–8) frei kombinierbar (7 Spalten) */}
        <div className={`lg:col-span-7 p-5 sm:p-6 rounded-2xl border shadow-sm ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-black flex items-center">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-black text-sm font-black mr-2.5">
                2
              </span>
              <Wrench className="w-5 h-5 mr-2 text-amber-500" />
              Karts selektieren ({activeKartsCount} fahrbereit)
            </h2>

            {/* Flotten-Umschalter inkl. Kombi-Betrieb (Erwachsene + Kinder zusammen) */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onFleetChange('adult')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                  fleetType === 'adult' && !anyJuniorActive
                    ? 'bg-amber-500 text-black border-amber-500 shadow'
                    : subBg
                }`}
              >
                Erwachsene (1–14)
              </button>

              <button
                type="button"
                onClick={onToggleJuniorFleetAddon}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center transition ${
                  anyJuniorActive && activeAdultCount > 0
                    ? 'bg-sky-500 text-black border-sky-400 shadow'
                    : 'border-sky-500/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                }`}
                title="Kinderkarts zusätzlich zu den Erwachsenen-Karts aktivieren oder deaktivieren"
              >
                <Layers className="w-3.5 h-3.5 mr-1" />
                {anyJuniorActive && activeAdultCount > 0
                  ? '✓ Kinderkarts zugeschaltet (Kombi)'
                  : '+ Kinderkarts dazuschalten'}
              </button>

              <button
                type="button"
                onClick={() => onFleetChange('junior')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                  activeAdultCount === 0 && anyJuniorActive
                    ? 'bg-amber-500 text-black border-amber-500 shadow'
                    : subBg
                }`}
              >
                Nur Kinder (1–8)
              </button>
            </div>
          </div>

          {/* A) Erwachsenen-Flotte (Kart 1 bis Kart 14) */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="uppercase tracking-wider text-emerald-400">
                🏎️ Erwachsenen-Karts (Kart 1–14) • {activeAdultCount} von {adultKarts.length} aktiv
              </span>
              <button
                type="button"
                onClick={() => onToggleKart(13)}
                className={`px-2.5 py-1 rounded-lg font-bold border text-[11px] flex items-center ${subBg}`}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Kart 13 {karts.find((k) => k.id === 13)?.active ? 'sperren' : 'freigeben'}
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {adultKarts.map((kart) => (
                <button
                  key={kart.id}
                  type="button"
                  onClick={() => onToggleKart(kart.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center active:scale-95 ${
                    kart.active
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-black shadow-sm'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-400 line-through opacity-55'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black">{kart.name}</span>
                  <span className="text-[10px] mt-0.5 flex items-center">
                    {kart.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Fährt
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-0.5" /> Aus
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* B) Kinderkarts (Kids 1 bis Kids 8) – jederzeit einzeln oder zusammen dazuschaltbar! */}
          <div className="pt-3 border-t border-[#535353]/30">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold mb-2">
              <span className="uppercase tracking-wider text-sky-400">
                🧒 Kinderkarts (Kids 1–8) • {activeJuniorCount} von {juniorKarts.length} zugeschaltet (Einzeln anklickbar)
              </span>
              <span className="text-[11px] opacity-70">
                Klicke einzelne Kinderkarts an, wenn sie gemeinsam mit Erwachsenen-Karts fahren sollen
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {juniorKarts.map((kart) => (
                <button
                  key={kart.id}
                  type="button"
                  onClick={() => onToggleKart(kart.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center active:scale-95 ${
                    kart.active
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-black shadow-sm'
                      : 'bg-[#242424]/60 border-[#3D3D3D] text-neutral-400 opacity-65 hover:opacity-100'
                  }`}
                >
                  <span className="text-xs font-black">{kart.name}</span>
                  <span className="text-[10px] mt-0.5 flex items-center">
                    {kart.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-0.5 text-sky-400" /> Aktiv
                      </>
                    ) : (
                      <span>+ Zuschalten</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          HAUPTBEREICH (EXTRA GROSS & ÜBERSICHTLICH):
          3. FAHRER EINTRAGEN (LINKS) & 4. GRUPPENEINTEILUNG & GRUPPEN-KARTS (RECHTS)
         ===================================================================== */}
      <div className={`p-5 sm:p-7 rounded-2xl border shadow-md ${cardBg}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LINKE SPALTE (5 Spalten): Großes Fahrer-Eintragsfenster */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg sm:text-xl font-black flex items-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-black text-sm font-black mr-2.5">
                    3
                  </span>
                  <Users className="w-5 h-5 mr-2 text-amber-500" />
                  Fahrer eintragen
                </h2>

                <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs sm:text-sm font-black">
                  {totalDriversCount} Fahrer erfasst
                </span>
              </div>

              <p className="text-xs opacity-75 mb-3">
                1 Name pro Zeile (am PC eintippen oder live per Smartphone-QR am Seitenende übertragen):
              </p>

              <textarea
                rows={16}
                value={rawDriversText}
                onChange={(e) => setRawDriversText(e.target.value)}
                placeholder="1 Name pro Zeile eingeben..."
                className={`w-full p-4 rounded-2xl border-2 font-mono font-bold text-base sm:text-lg leading-relaxed focus:outline-none focus:border-amber-500 transition ${subBg}`}
              />
            </div>

            {/* Große Start-Buttons direkt unter dem Fahrerfeld (auch auf Tablets sofort erreichbar) */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onOpenRotationBoard}
                className={`py-4 px-4 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center transition hover:border-amber-500 active:scale-[0.99] ${subBg}`}
              >
                <Grid className="w-5 h-5 mr-2 text-amber-500 shrink-0" />
                <span>Gruppen-Matrix</span>
              </button>

              <button
                type="button"
                onClick={onInitializeSessions}
                className="py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm sm:text-base shadow-xl flex items-center justify-center transition active:scale-[0.99]"
              >
                <Play className="w-5 h-5 mr-2 fill-black shrink-0" />
                <span>Karten erzeugen & Start</span>
              </button>
            </div>
          </div>

          {/* RECHTE SPALTE (7 Spalten): Großes, komplett sichtbares Gruppeneinteilungs- & Kart-Verteilungs-Fenster */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg sm:text-xl font-black flex items-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-black text-sm font-black mr-2.5">
                    4
                  </span>
                  Gruppeneinteilung & Gruppen-Karts ({groups.length} Gruppen)
                </h2>

                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Max. {Math.min(maxTrackKarts, activeKartsCount)} Fahrer pro Gruppe
                </span>
              </div>

              <p className="text-xs opacity-75 mb-3">
                Klicke in einer Gruppe auf die gewünschten Karts (Erwachsenen- oder Kinderkarts), um sie dieser Gruppe fest zuzuweisen:
              </p>

              {/* Große Gruppen-Karten ohne eingeengten Mini-Scrollbalken */}
              <div className="space-y-4">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition ${subBg}`}
                  >
                    {/* Kopfzeile der Gruppe */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#535353]/30">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-3.5 py-1 rounded-xl bg-amber-500 text-black font-black text-sm sm:text-base">
                          {g.name}
                        </span>
                        <span className="font-black text-sm sm:text-base">
                          {g.drivers.length} Fahrer
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                        Aktive Gruppen-Karts:{' '}
                        {g.assignedKarts.slice(0, g.drivers.length).join(', ')}
                      </div>
                    </div>

                    {/* Große Kart-Auswahl-Buttons für diese Gruppe (Erwachsene + zugeschaltete Kinderkarts) */}
                    <div className="mb-3.5">
                      <div className="text-[11px] font-bold uppercase opacity-70 mb-1.5">
                        Karts für {g.name} antippen / auswählen:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeKarts.map((k) => {
                          const isAssigned = g.assignedKarts
                            .slice(0, g.drivers.length)
                            .includes(k.name);
                          const isKids =
                            k.category === 'junior' || k.name.startsWith('Kids');
                          return (
                            <button
                              key={k.id}
                              type="button"
                              onClick={() => handleToggleGroupKart(g, k.name)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black border transition active:scale-95 ${
                                isAssigned
                                  ? isKids
                                    ? 'bg-sky-400 text-black border-sky-300 shadow'
                                    : 'bg-amber-500 text-black border-amber-400 shadow'
                                  : 'bg-black/20 border-[#535353]/60 opacity-55 hover:opacity-100'
                              }`}
                              title="Antippen, um dieses Kart der Gruppe zuzuweisen"
                            >
                              {k.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Großzügige Fahrer-Karten dieser Gruppe */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#535353]/25">
                      {g.drivers.map((d, dIdx) => {
                        const assignedKart = g.assignedKarts[dIdx] || '–';
                        const isKidsKart = assignedKart.startsWith('Kids');
                        return (
                          <div
                            key={d.id}
                            className="px-3 py-2 rounded-xl bg-black/25 border border-[#535353]/30 flex items-center justify-between gap-2"
                          >
                            <div className="truncate flex items-center space-x-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono text-xs font-black shrink-0">
                                #{d.id}
                              </span>
                              <span className="font-black text-sm sm:text-base truncate">
                                {d.name}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-black shrink-0 ${
                                isKidsKart
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {assignedKart}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FUSSZEILE (UNTEN): SMARTPHONE FAHRER-ERFASSUNG & WLAN LIVE-SYNC (QR-CODE)
         ===================================================================== */}
      <footer
        className={`p-5 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${cardBg}`}
      >
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
          <div
            onClick={onOpenQrModal}
            className="cursor-pointer shrink-0 hover:scale-105 transition"
            title="Klicken zum Vergrößern"
          >
            <QrCodeSvg url={mobileUrl} sizePx={84} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-500 flex items-center">
                <Smartphone className="w-4 h-4 mr-1" />
                📱 Smartphone Fahrer-Erfassung & Tablet WLAN-Info
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                ● WLAN Live-Sync aktiv
              </span>
            </div>
            <p className="text-xs sm:text-sm opacity-85 mt-1">
              Smartphone Check-In (QR-Code scannen):{' '}
              <strong className="font-mono text-amber-400">{mobileUrl}</strong>
            </p>
            <p className="text-xs opacity-65 mt-0.5">
              Hauptansicht für Tablets / Boxengassen-TV:{' '}
              <span className="font-mono font-bold">{mainUrl}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenQrModal}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white flex items-center shadow transition active:scale-95"
          >
            <QrCode className="w-4 h-4 mr-1.5" />
            QR-Code groß anzeigen
          </button>
          <button
            type="button"
            onClick={handleCopyMobileUrl}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center hover:bg-amber-500/25 transition active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" /> Kopiert
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Link kopieren
              </>
            )}
          </button>
          <a
            href="/mobile"
            target="_blank"
            rel="noreferrer"
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center hover:border-amber-500 transition ${subBg}`}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            /mobile öffnen
          </a>
        </div>
      </footer>
    </div>
  );
}
