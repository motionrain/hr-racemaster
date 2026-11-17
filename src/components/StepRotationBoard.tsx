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
  ArrowUpDown,
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
  onPrintQualiTotal: () => void;
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
  onPrintQualiTotal,
}: StepRotationBoardProps) {
  const [liveScreenMode, setLiveScreenMode] = useState<boolean>(false);
  const [showTimesInCells, setShowTimesInCells] = useState<boolean>(true);
  // Standardmäßig nach schnellster Gesamtzeit sortieren!
  const [sortByTotalTime, setSortByTotalTime] = useState<boolean>(true);

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
              {liveScreenMode ? 'LIVE-TV / BOXENGASSEN-MONITOR' : 'GRUPPEN-MATRIX & GESAMTWERTUNG'}
            </span>
            {activeCard && (
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Aktuell: {activeCard.title}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center">
            <Grid className="w-6 h-6 mr-2 text-amber-500" />
            {eventName} – Gruppen-Matrix ({groups.length} Gruppen × {qualiTurns} Läufe)
          </h2>
          <p className="text-xs opacity-75">
            Die Fahrer-Positionen sortieren sich automatisch nach der schnellsten Gesamtzeit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSortByTotalTime(!sortByTotalTime)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center transition ${
              sortByTotalTime
                ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                : subBg
            }`}
          >
            <ArrowUpDown className="w-4 h-4 mr-1.5 text-amber-500" />
            {sortByTotalTime
              ? 'Sortiert nach: Schnellster Gesamtzeit'
              : 'Sortiert nach: Start-Nr.'}
          </button>

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
                Zeiten einblenden
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
                Live-Screen (Vollbild)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onPrintQualiTotal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow-lg transition"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Quali-Matrix A4 drucken
          </button>
        </div>
      </div>

      {/* Gruppen-Tabellen (Gruppe A, Gruppe B, Gruppe C...) */}
      <div className="space-y-6">
        {groups.map((group) => {
          const groupQualiCards = Array.from({ length: qualiTurns }, (_, t) =>
            cards.find(
              (c) =>
                c.kind === 'quali' &&
                c.groupName === group.name &&
                c.turnIndex === t
            )
          );

          const hasRestingRow = groupQualiCards.some(
            (c) => c && c.restingKarts && c.restingKarts.length > 0
          );

          // Fahrer entweder nach schnellster Gesamtzeit (Standard) oder nach Start-Nr. sortieren
          const sortedGroupDrivers = [...group.drivers].sort((a, b) => {
            if (!sortByTotalTime) return a.id - b.id;
            const stA = standings.find((s) => s.driverId === a.id);
            const stB = standings.find((s) => s.driverId === b.id);
            const rankA = stA?.rank ?? 999;
            const rankB = stB?.rank ?? 999;
            return rankA - rankB;
          });

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
                    {group.drivers.length} Fahrer • Sortiert nach schnellster Gesamtzeit
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
                      <th className="p-2.5 w-16 text-center">Pos</th>
                      <th className="p-2.5 w-20 text-center">Gesamt</th>
                      <th className="p-2.5 min-w-[170px]">Fahrer</th>
                      {Array.from({ length: qualiTurns }, (_, t) => {
                        const card = groupQualiCards[t];
                        const isCurrent =
                          card && cards[activeCardIndex]?.id === card.id;
                        return (
                          <th
                            key={t}
                            className={`p-2.5 text-center min-w-[96px] ${
                              isCurrent
                                ? 'bg-emerald-500/25 text-emerald-400 border-b-2 border-emerald-500'
                                : ''
                            }`}
                          >
                            <div>Lauf {t + 1}</div>
                            {isCurrent && (
                              <div className="text-[10px] font-black text-emerald-400">
                                ● LIVE
                              </div>
                            )}
                          </th>
                        );
                      })}
                      <th className="p-2.5 text-right w-28">Beste Runde</th>
                      <th className="p-2.5 text-right w-32">Gesamtzeit</th>
                      <th className="p-2.5 text-center w-36">Final-Zuteilung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#535353]/25">
                    {sortedGroupDrivers.map((driver, posIdx) => {
                      const st = standings.find((s) => s.driverId === driver.id);
                      return (
                        <tr
                          key={driver.id}
                          className="hover:bg-amber-500/5 transition"
                        >
                          <td className="p-2.5 text-center font-black">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                                posIdx === 0 && st?.totalTime
                                  ? 'bg-amber-500 text-black'
                                  : subBg
                              }`}
                            >
                              P{posIdx + 1}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-xs font-bold text-amber-400">
                            {st?.totalTime ? `#${st.rank}` : `#${driver.id}`}
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
                                    <span className="text-[10px] font-normal opacity-95 mt-0.5">
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
                          <td className="p-2.5 text-center">
                            {st?.targetFinalName ? (
                              <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                {st.targetFinalName.replace('Finale ', '')} (P{st.targetGridPos})
                              </span>
                            ) : (
                              '–'
                            )}
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
                        <td className="p-2.5 text-center font-mono text-xs text-rose-400">
                          Box
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
                        <td colSpan={3} className="p-2.5 text-right text-xs opacity-50">
                          –
                        </td>
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
