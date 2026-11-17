// src/components/StepRotationBoard.tsx
import React, { useState } from 'react';
import {
  Printer,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Play,
  CheckCircle2,
  Clock,
  Grid,
} from 'lucide-react';
import {
  OverallDriverStanding,
  RaceGroup,
  SessionCard,
} from '../types/kart';

interface StepRotationBoardProps {
  darkMode: boolean;
  eventName: string;
  groups: RaceGroup[];
  cards: SessionCard[];
  qualiTurns: number;
  activeCardIndex: number;
  standings: OverallDriverStanding[];
  onSelectCardIndex: (idx: number) => void;
  onPrintPlan: () => void;
}

export default function StepRotationBoard({
  darkMode,
  eventName,
  groups,
  cards,
  qualiTurns,
  activeCardIndex,
  standings,
  onSelectCardIndex,
  onPrintPlan,
}: StepRotationBoardProps) {
  const [liveScreenMode, setLiveScreenMode] = useState<boolean>(false);
  const [showTimesInCells, setShowTimesInCells] = useState<boolean>(true);

  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  const activeCard = cards[activeCardIndex];

  return (
    <div
      className={
        liveScreenMode
          ? `fixed inset-0 z-50 overflow-y-auto p-6 ${
              darkMode ? 'bg-[#0B0B0B] text-[#FAFAFA]' : 'bg-[#F5F5F5] text-[#1A1A1A]'
            }`
          : 'space-y-6'
      }
    >
      {/* Top Action & Live-Screen Controls */}
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-xs font-black uppercase">
              {liveScreenMode ? 'LIVE-TV / BOXENGASSEN-MONITOR' : 'GESAMTANSICHT KART-ROTATION'}
            </span>
            {activeCard && (
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Aktuell an der Reihe: {activeCard.title}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center">
            <Grid className="w-6 h-6 mr-2 text-amber-500" />
            {eventName} – Gruppen- & Kart-Rotationsplan ({groups.length} Gruppen × {qualiTurns} Läufe)
          </h2>
          <p className="text-xs opacity-75">
            Übersichtstafel für Fahrer & Einweiser: Wer fährt in welchem Lauf mit welchem Kart (inkl. pausierender Karts in der Boxengasse).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTimesInCells(!showTimesInCells)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center transition ${subBg}`}
          >
            {showTimesInCells ? (
              <>
                <EyeOff className="w-4 h-4 mr-1.5 text-amber-500" />
                Zeiten ausblenden
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5 text-amber-500" />
                Gefahrene Zeiten einblenden
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setLiveScreenMode(!liveScreenMode)}
            className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center transition ${
              liveScreenMode
                ? 'bg-rose-500 text-white border-rose-500'
                : subBg
            }`}
          >
            {liveScreenMode ? (
              <>
                <Minimize2 className="w-4 h-4 mr-1.5" />
                Vollbild schließen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 mr-1.5 text-amber-500" />
                Als Live-Screen (Vollbild)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onPrintPlan}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow-lg transition"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Als A4-Aushang drucken
          </button>
        </div>
      </div>

      {/* Gruppen-Tabellen (Gruppe A, Gruppe B, Gruppe C...) */}
      <div className="space-y-6">
        {groups.map((group) => {
          // Alle Qualifying-Karten dieser Gruppe (Lauf 1 .. Lauf N)
          const groupQualiCards = Array.from({ length: qualiTurns }, (_, t) =>
            cards.find((c) => c.kind === 'quali' && c.groupName === group.name && c.turnIndex === t)
          );

          const hasRestingRow = groupQualiCards.some(
            (c) => c && c.restingKarts && c.restingKarts.length > 0
          );

          return (
            <div
              key={group.id}
              className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#535353]/30">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-lg bg-amber-500 text-black font-black text-sm">
                    {group.name}
                  </span>
                  <span className="text-sm font-bold opacity-80">
                    {group.drivers.length} Fahrer • {qualiTurns} Läufe (Jeder fährt jedes Kart)
                  </span>
                </div>

                {/* Schnell-Navigation zu den Läufen dieser Gruppe */}
                <div className="flex flex-wrap gap-1.5">
                  {groupQualiCards.map((c, tIdx) => {
                    if (!c) return null;
                    const cardGlobalIdx = cards.findIndex((allC) => allC.id === c.id);
                    const isCurrent = cardGlobalIdx === activeCardIndex;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCardIndex(cardGlobalIdx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center space-x-1 transition ${
                          isCurrent
                            ? 'bg-emerald-500 text-black border-emerald-500 font-black animate-pulse'
                            : c.karasState === 'stopped'
                            ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                            : subBg
                        }`}
                        title="Klicken, um diesen Lauf im Live-Cockpit zu öffnen"
                      >
                        {isCurrent ? (
                          <Play className="w-3 h-3 fill-black mr-1" />
                        ) : c.karasState === 'stopped' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : null}
                        <span>Lauf {tIdx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rotations-Matrix-Tabelle für diese Gruppe */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase ${subBg}`}>
                      <th className="p-2.5 w-16 text-center">Start-Nr.</th>
                      <th className="p-2.5 min-w-[170px]">Fahrer</th>
                      {Array.from({ length: qualiTurns }, (_, t) => {
                        const card = groupQualiCards[t];
                        const isCurrent =
                          card && cards[activeCardIndex]?.id === card.id;
                        return (
                          <th
                            key={t}
                            className={`p-2.5 text-center min-w-[100px] ${
                              isCurrent
                                ? 'bg-emerald-500/25 text-emerald-400 border-b-2 border-emerald-500'
                                : ''
                            }`}
                          >
                            <div>Lauf {t + 1}</div>
                            {isCurrent && (
                              <div className="text-[10px] font-black text-emerald-400">
                                ● LIVE AUF BAHN
                              </div>
                            )}
                          </th>
                        );
                      })}
                      <th className="p-2.5 text-right w-28">Bestzeit</th>
                      <th className="p-2.5 text-right w-32">Gesamtzeit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#535353]/25">
                    {group.drivers.map((driver) => {
                      const st = standings.find((s) => s.driverId === driver.id);
                      return (
                        <tr
                          key={driver.id}
                          className="hover:bg-amber-500/5 transition"
                        >
                          <td className="p-2.5 text-center font-mono font-black text-amber-500">
                            #{driver.id}
                          </td>
                          <td className="p-2.5 font-bold">{driver.name}</td>
                          {Array.from({ length: qualiTurns }, (_, t) => {
                            const card = groupQualiCards[t];
                            const entry = card?.entries.find(
                              (e) => e.driverId === driver.id
                            );
                            const isCurrent =
                              card && cards[activeCardIndex]?.id === card.id;
                            const hasTime =
                              entry?.bestTime && parseFloat(entry.bestTime) > 0;

                            return (
                              <td
                                key={t}
                                className={`p-2 text-center ${
                                  isCurrent ? 'bg-emerald-500/10' : ''
                                }`}
                              >
                                <div
                                  className={`inline-flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border font-mono text-xs font-black min-w-[82px] ${
                                    isCurrent
                                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                      : hasTime
                                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                                      : subBg
                                  }`}
                                >
                                  <span>{entry?.kartName || '–'}</span>
                                  {showTimesInCells && hasTime && (
                                    <span className="text-[10px] font-normal opacity-90 mt-0.5">
                                      {Number(entry?.bestTime).toFixed(3)} s
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-right font-mono text-xs">
                            {st?.bestLap ? `${st.bestLap.toFixed(3)} s` : '–'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-amber-500">
                            {st?.totalTime ? `${st.totalTime.toFixed(3)} s` : '–'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Zeile für freie / pausierende Karts in der Boxengasse */}
                    {hasRestingRow && (
                      <tr className="bg-rose-500/10 border-t-2 border-rose-500/30">
                        <td className="p-2.5 text-center font-mono font-black text-rose-400">
                          –
                        </td>
                        <td className="p-2.5 font-black text-xs uppercase text-rose-400">
                          Freies Kart (Pause in Box)
                        </td>
                        {Array.from({ length: qualiTurns }, (_, t) => {
                          const card = groupQualiCards[t];
                          const resting = card?.restingKarts || [];
                          return (
                            <td
                              key={t}
                              className="p-2 text-center font-mono text-xs font-black text-rose-400"
                            >
                              {resting.length > 0 ? resting.join(', ') : '–'}
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-right text-xs opacity-50">–</td>
                        <td className="p-2.5 text-right text-xs opacity-50">–</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
