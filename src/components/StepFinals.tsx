// src/components/StepFinals.tsx
import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Minus,
  Printer,
  Shuffle,
  ListOrdered,
  Play,
  Square,
  Zap,
  Radio,
  ArrowRight,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import {
  KartItem,
  OverallDriverStanding,
  SessionCard,
} from '../types/kart';
import {
  sortSessionEntries,
  calculateCombinedFinalStandings,
} from '../lib/raceLogic';

interface StepFinalsProps {
  darkMode: boolean;
  standings: OverallDriverStanding[];
  finalCards: SessionCard[];
  activeFinalIndex: number;
  setActiveFinalIndex: (idx: number) => void;
  activeKarts: KartItem[];
  onUpdateFinalCard: (updated: SessionCard) => void;
  onRegenerateFinals: () => void;
  onPrintSingleFinal: (idx: number) => void;
  onPrintOverallFinal: () => void;
  // KaRaS Bridge Props für das aktuell gewählte Finale
  bridgeOnline: boolean;
  autoPoll: boolean;
  setAutoPoll: (v: boolean) => void;
  onTriggerStart: () => void;
  onTriggerStop: () => void;
  onSimulatePass: () => void;
}

export default function StepFinals({
  darkMode,
  standings,
  finalCards,
  activeFinalIndex,
  setActiveFinalIndex,
  activeKarts,
  onUpdateFinalCard,
  onRegenerateFinals,
  onPrintSingleFinal,
  onPrintOverallFinal,
  bridgeOnline,
  autoPoll,
  setAutoPoll,
  onTriggerStart,
  onTriggerStop,
  onSimulatePass,
}: StepFinalsProps) {
  const [overallMode, setOverallMode] = useState<'tiered' | 'direct_laps'>('tiered');

  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  const currentFinal = finalCards[activeFinalIndex] || finalCards[0];

  const adjustLaps = (card: SessionCard, driverId: number, delta: number) => {
    const updated = card.entries.map((e) =>
      e.driverId === driverId ? { ...e, laps: Math.max(0, e.laps + delta) } : e
    );
    onUpdateFinalCard({ ...card, entries: updated });
  };

  const setDirectLaps = (card: SessionCard, driverId: number, val: string) => {
    const parsed = parseInt(val, 10);
    const laps = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const updated = card.entries.map((e) =>
      e.driverId === driverId ? { ...e, laps } : e
    );
    onUpdateFinalCard({ ...card, entries: updated });
  };

  const handleBestTime = (card: SessionCard, driverId: number, val: string) => {
    const updated = card.entries.map((e) =>
      e.driverId === driverId ? { ...e, bestTime: val.replace(',', '.') } : e
    );
    onUpdateFinalCard({ ...card, entries: updated });
  };

  const handleKartChange = (
    card: SessionCard,
    driverId: number,
    newKart: string
  ) => {
    const targetDriver = card.entries.find((e) => e.driverId === driverId);
    const otherDriver = card.entries.find(
      (e) => e.kartName === newKart && e.driverId !== driverId
    );
    const updated = card.entries.map((e) => {
      if (e.driverId === driverId) return { ...e, kartName: newKart };
      if (otherDriver && e.driverId === otherDriver.driverId && targetDriver) {
        return { ...e, kartName: targetDriver.kartName };
      }
      return e;
    });
    onUpdateFinalCard({ ...card, entries: updated });
  };

  const assignSequential = (card: SessionCard) => {
    const updated = card.entries.map((e, idx) => ({
      ...e,
      kartName: activeKarts[idx % activeKarts.length]?.name || e.kartName,
    }));
    onUpdateFinalCard({ ...card, entries: updated });
  };

  const assignRandom = (card: SessionCard) => {
    const pool = [...activeKarts].sort(() => Math.random() - 0.5);
    const updated = card.entries.map((e, idx) => ({
      ...e,
      kartName: pool[idx % pool.length]?.name || e.kartName,
    }));
    onUpdateFinalCard({ ...card, entries: updated });
  };

  const combinedFinalStandings = calculateCombinedFinalStandings(
    finalCards,
    overallMode
  );

  const allFinalsCompleted =
    finalCards.length > 0 &&
    finalCards.every(
      (c) => c.karasState === 'stopped' || c.entries.some((e) => e.laps > 0)
    );

  return (
    <div className="space-y-6">
      {/* Info-Header: Langsamste Gruppe startet zuerst */}
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-xs font-black uppercase">
              STARTREIHENFOLGE: LANGSAMSTE GRUPPE ZUERST
            </span>
            <span className="text-xs opacity-75">
              Wertung nach Position / Rundenanzahl (KaRaS Live-Erkennung)
            </span>
          </div>
          <h2 className="text-xl font-black flex items-center mt-1">
            <Trophy className="w-6 h-6 mr-2 text-amber-500" />
            Finalläufe ({finalCards.map((c) => c.groupName.replace('Finale ', '')).join(' ➔ ')})
          </h2>
          <p className="text-xs opacity-75">
            Zuerst startet die langsamere Gruppe mit eigener Wertung – zum Abschluss fährt Gruppe A um den Gesamtsieg.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRegenerateFinals}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition hover:border-amber-500 ${subBg}`}
          >
            Startaufstellung aus Quali aktualisieren
          </button>
          <button
            type="button"
            onClick={onPrintOverallFinal}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Gesamtwertung Finale drucken (A4)
          </button>
        </div>
      </div>

      {/* Horizontale Final-Karten-Auswahl (Gruppe B -> Gruppe A) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {finalCards.map((fc, idx) => {
          const isCurrent = idx === activeFinalIndex;
          const stateBadge =
            fc.karasState === 'stopped'
              ? '🏁'
              : fc.karasState === 'running'
              ? '🟢'
              : '⏳';
          return (
            <button
              key={fc.id}
              type="button"
              onClick={() => setActiveFinalIndex(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border transition flex items-center space-x-2 ${
                isCurrent
                  ? 'bg-amber-500 text-black border-amber-500 shadow-md'
                  : subBg
              }`}
            >
              <span>{stateBadge}</span>
              <span>
                {idx + 1}. Start: {fc.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* AKTIVE FINAL-LIVE-KARTE (Genau wie im Qualifying, aber auf Position/Runden ausgelegt!) */}
      {currentFinal && (
        <div className={`p-6 rounded-2xl border shadow-md ${cardBg}`}>
          {/* Status-Banner & KaRaS Start/Stopp Steuerung */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#535353]/30">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    currentFinal.karasState === 'waiting'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : currentFinal.karasState === 'running'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  }`}
                >
                  {currentFinal.karasState === 'waiting' &&
                    '⏳ Wartet auf KaRaS Start...'}
                  {currentFinal.karasState === 'running' &&
                    '🟢 KaRaS läuft • Runden & Positionen live'}
                  {currentFinal.karasState === 'stopped' &&
                    '🏁 KaRaS Stopp erkannt • Finallauf beendet'}
                </span>
                <span className="text-xs opacity-60">
                  Finallauf {activeFinalIndex + 1} von {finalCards.length}
                </span>
              </div>
              <h3 className="text-2xl font-black mt-1 text-amber-500">
                {currentFinal.title}
              </h3>
              <p className="text-xs opacity-75">{currentFinal.subtitle}</p>
            </div>

            {/* KaRaS Live-Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoPoll(!autoPoll)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center ${
                  autoPoll
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : subBg
                }`}
              >
                <Radio className="w-4 h-4 mr-1.5" />
                KaRaS Auto-Bridge{' '}
                {autoPoll ? (bridgeOnline ? '(Online)' : '(Suche...)') : '(Aus)'}
              </button>

              {currentFinal.karasState === 'waiting' && (
                <button
                  type="button"
                  onClick={onTriggerStart}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center shadow"
                >
                  <Play className="w-4 h-4 mr-1 fill-black" />
                  KaRaS Start erkannt
                </button>
              )}

              {currentFinal.karasState === 'running' && (
                <>
                  <button
                    type="button"
                    onClick={onSimulatePass}
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center"
                  >
                    <Zap className="w-4 h-4 mr-1" /> + Runden-Impuls (Alle Karts)
                  </button>
                  <button
                    type="button"
                    onClick={onTriggerStop}
                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center shadow"
                  >
                    <Square className="w-4 h-4 mr-1 fill-white" />
                    KaRaS Stopp erkannt
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Kart-Zuweisung für diesen Finallauf */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold opacity-75">
                Start-Karts für {currentFinal.groupName}:
              </span>
              <button
                type="button"
                onClick={() => assignSequential(currentFinal)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
              >
                <ListOrdered className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Zahlenfolge (1, 2, 3...)
              </button>
              <button
                type="button"
                onClick={() => assignRandom(currentFinal)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
              >
                <Shuffle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Karts auslosen
              </button>
            </div>
            <div className="text-xs font-bold text-amber-400">
              Sortierung: Position nach Rundenanzahl (Meiste Runden = P1)
            </div>
          </div>

          {/* Tabelle für das aktuelle Gruppen-Finale (Sortiert nach Runden / Position) */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase ${subBg}`}>
                  <th className="p-3 w-20 text-center">Position</th>
                  <th className="p-3 w-28 text-center">Startplatz</th>
                  <th className="p-3">Fahrer</th>
                  <th className="p-3 w-44">Kart (Wählbar)</th>
                  <th className="p-3 text-center w-52">
                    Gefahrene Runden (Wertung)
                  </th>
                  <th className="p-3 text-center w-32">Letzte Runde</th>
                  <th className="p-3 text-right w-40">Schnellste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#535353]/25">
                {sortSessionEntries(currentFinal).map((entry, idx) => (
                  <tr
                    key={entry.driverId}
                    className="hover:bg-amber-500/5 transition"
                  >
                    <td className="p-3 text-center font-black">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-500 text-black shadow'
                            : idx === 1
                            ? 'bg-neutral-300 text-black'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : subBg
                        }`}
                      >
                        P{idx + 1}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-xs">
                      <span className="font-bold">Pole P{entry.gridPos}</span>
                      {entry.qualiRank && (
                        <span className="block text-[10px] opacity-65">
                          (Quali #{entry.qualiRank})
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-base">
                      {entry.driverName}
                    </td>
                    <td className="p-3">
                      <select
                        value={entry.kartName}
                        onChange={(e) =>
                          handleKartChange(
                            currentFinal,
                            entry.driverId,
                            e.target.value
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold w-full ${subBg}`}
                      >
                        {activeKarts.map((k) => {
                          const occ = currentFinal.entries.find(
                            (o) =>
                              o.kartName === k.name &&
                              o.driverId !== entry.driverId
                          );
                          return (
                            <option key={k.id} value={k.name}>
                              {k.name}
                              {occ ? ` (⇄ ${occ.driverName})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            adjustLaps(currentFinal, entry.driverId, -1)
                          }
                          className={`p-1.5 rounded-lg border hover:border-amber-500 ${subBg}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={entry.laps}
                          onChange={(e) =>
                            setDirectLaps(
                              currentFinal,
                              entry.driverId,
                              e.target.value
                            )
                          }
                          className={`w-16 px-2 py-1 rounded-lg border text-center font-mono font-black text-base text-amber-500 ${subBg}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            adjustLaps(currentFinal, entry.driverId, 1)
                          }
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow"
                        >
                          <Plus className="w-3.5 h-3.5 mr-0.5" /> 1
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-xs opacity-75">
                      {entry.lastTime ? `${entry.lastTime} s` : '–'}
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="text"
                        placeholder="00.000"
                        value={entry.bestTime}
                        onChange={(e) =>
                          handleBestTime(
                            currentFinal,
                            entry.driverId,
                            e.target.value
                          )
                        }
                        className={`w-28 px-2.5 py-1.5 rounded-lg border text-right font-mono text-xs font-bold ${subBg}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fußzeile der aktiven Final-Karte: Einzelwertung drucken & Weiter zum nächsten Finale */}
          <div className="mt-6 pt-4 border-t border-[#535353]/30 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onPrintSingleFinal(activeFinalIndex)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm border flex items-center hover:border-amber-500 ${subBg}`}
            >
              <Printer className="w-4 h-4 mr-2 text-amber-500" />
              🖨️ Einzelwertung {currentFinal.groupName} drucken (A4)
            </button>

            {activeFinalIndex < finalCards.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveFinalIndex(activeFinalIndex + 1)}
                className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg flex items-center transition"
              >
                <span>
                  NEXT / WEITER ZU{' '}
                  {finalCards[activeFinalIndex + 1]?.groupName.toUpperCase()}
                </span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onPrintOverallFinal}
                className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg flex items-center transition"
              >
                <Trophy className="w-5 h-5 mr-2" />
                <span>GESAMTWERTUNG FINALE (ALLE GRUPPEN) DRUCKEN</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ÜBERSICHT: EINZELWERTUNGEN PRO GRUPPE + GESAMTWERTUNG FINALE (ALLE GRUPPEN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linke Spalte: Einzelwertungen der Gruppen (z.B. Gruppe B zuerst, dann Gruppe A) */}
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
          <h3 className="text-base font-black mb-3 flex items-center">
            <Flag className="w-5 h-5 mr-2 text-amber-500" />
            Einzelwertungen der Final-Gruppen (Startreihenfolge)
          </h3>
          <div className="space-y-4">
            {finalCards.map((fc, fIdx) => {
              const sorted = sortSessionEntries(fc);
              return (
                <div key={fc.id} className={`p-4 rounded-xl border ${subBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-xs text-amber-500 uppercase">
                      {fIdx + 1}. Lauf: {fc.groupName}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPrintSingleFinal(fIdx)}
                      className="text-xs font-bold underline hover:text-amber-400 flex items-center"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" /> Einzel-Aushang A4
                    </button>
                  </div>
                  <div className="divide-y divide-[#535353]/25 text-xs">
                    {sorted.map((e, pos) => (
                      <div
                        key={e.driverId}
                        className="py-1.5 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-black mr-2">P{pos + 1}</span>
                          <span className="font-bold">{e.driverName}</span>
                          <span className="opacity-65 ml-2 font-mono">
                            ({e.kartName} • Pole P{e.gridPos})
                          </span>
                        </div>
                        <div className="font-mono font-black text-amber-400">
                          {e.laps} Runden{' '}
                          {e.bestTime ? `(${Number(e.bestTime).toFixed(3)}s)` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rechte Spalte: Kombinierte Gesamtwertung Finale (wenn auch Gruppe A gefahren ist) */}
        <div className={`p-6 rounded-2xl border ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-black flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-amber-500" />
                Gesamtwertung Finale (Alle Gruppen kombiniert)
              </h3>
              <p className="text-[11px] opacity-70">
                {allFinalsCompleted ? (
                  <span className="text-emerald-400 font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Alle Finalgruppen gewertet – Endstand komplett!
                  </span>
                ) : (
                  'Aktualisiert sich live nach jedem beendeten Gruppen-Finale.'
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOverallMode('tiered')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  overallMode === 'tiered'
                    ? 'bg-amber-500 text-black border-amber-500'
                    : subBg
                }`}
              >
                Nach Final-Gruppe (A vor B)
              </button>
              <button
                type="button"
                onClick={() => setOverallMode('direct_laps')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  overallMode === 'direct_laps'
                    ? 'bg-amber-500 text-black border-amber-500'
                    : subBg
                }`}
              >
                Direkt nach Runden
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={`border-b uppercase ${subBg}`}>
                  <th className="p-2 text-center">Gesamt</th>
                  <th className="p-2">Fahrer</th>
                  <th className="p-2">Final-Gruppe</th>
                  <th className="p-2 text-center">Runden</th>
                  <th className="p-2 text-right">Beste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#535353]/25">
                {combinedFinalStandings.map((row) => (
                  <tr key={row.driverId}>
                    <td className="p-2 text-center font-black text-amber-500">
                      #{row.overallRank}
                    </td>
                    <td className="p-2 font-bold">{row.driverName}</td>
                    <td className="p-2 opacity-80">
                      {row.finalGroupName.replace('Finale ', '')} (P{row.groupRank})
                    </td>
                    <td className="p-2 text-center font-mono font-black">
                      {row.laps} Rd.
                    </td>
                    <td className="p-2 text-right font-mono">
                      {row.bestTime ? `${Number(row.bestTime).toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
