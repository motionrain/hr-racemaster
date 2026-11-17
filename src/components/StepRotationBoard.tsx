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
  Shuffle,
  ListOrdered,
} from 'lucide-react';
import {
  KartItem,
  OverallDriverStanding,
  RaceGroup,
  SessionCard,
} from '../types/kart';

interface StepRotationBoardProps {
  darkMode: boolean;
  eventName: string;
  groups: RaceGroup[];
  cards: SessionCard[];
  activeKarts: KartItem[];
  qualiTurns: number;
  activeCardIndex: number;
  standings: OverallDriverStanding[];
  onSelectCardIndex: (idx: number) => void;
  onUpdateCard: (updated: SessionCard) => void;
  onAssignGroupKarts: (groupName: string, karts: string[]) => void;
  onPrintPlan: () => void;
  onPrintQualiTotal: () => void;
}

export default function StepRotationBoard({
  darkMode,
  eventName,
  groups,
  cards,
  activeKarts,
  qualiTurns,
  activeCardIndex,
  standings,
  onSelectCardIndex,
  onUpdateCard,
  onAssignGroupKarts,
  onPrintPlan,
  onPrintQualiTotal,
}: StepRotationBoardProps) {
  const [liveScreenMode, setLiveScreenMode] = useState<boolean>(false);
  const [showTimesInCells, setShowTimesInCells] = useState<boolean>(true);
  const [sortByTotalTime, setSortByTotalTime] = useState<boolean>(true);

  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  const activeCard = cards[activeCardIndex];

  const handleCellKartChange = (
    card: SessionCard | undefined,
    driverId: number,
    newKartName: string
  ) => {
    if (!card) return;
    const target = card.entries.find((e) => e.driverId === driverId);
    const other = card.entries.find(
      (e) => e.kartName === newKartName && e.driverId !== driverId
    );
    const updatedEntries = card.entries.map((e) => {
      if (e.driverId === driverId) return { ...e, kartName: newKartName };
      if (other && e.driverId === other.driverId && target) {
        return { ...e, kartName: target.kartName };
      }
      return e;
    });
    onUpdateCard({ ...card, entries: updatedEntries });
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
    <div
      className={
        liveScreenMode
          ? `fixed inset-0 z-50 overflow-y-auto p-6 ${
              darkMode ? 'bg-[#0B0B0B] text-[#FAFAFA]' : 'bg-[#F5F5F5] text-[#1A1A1A]'
            }`
          : 'space-y-6'
      }
    >
      <div
        className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-xs font-black uppercase">
              {liveScreenMode ? 'LIVE-TV / BOXENGASSEN-MONITOR' : 'GRUPPEN-ROTATION & KART-VERTEILUNG'}
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
            {eventName} ({groups.length} Gruppen × {qualiTurns} Läufe)
          </h2>
          <p className="text-xs opacity-75">
            Wähle für jede Gruppe oben die Karts per Klick aus oder tausche sie direkt in den Zellen.
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
            {sortByTotalTime ? 'Sortiert: Beste Gesamtzeit' : 'Sortiert: Start-Nr.'}
          </button>

          <button
            type="button"
            onClick={() => setShowTimesInCells(!showTimesInCells)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center transition ${subBg}`}
          >
            {showTimesInCells ? (
              <>
                <EyeOff className="w-4 h-4 mr-1.5 text-amber-500" />
                Zeiten aus
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5 text-amber-500" />
                Zeiten an
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setLiveScreenMode(!liveScreenMode)}
            className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center transition ${
              liveScreenMode ? 'bg-rose-500 text-white border-rose-500' : subBg
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
            onClick={onPrintPlan}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center ${subBg}`}
          >
            <Printer className="w-4 h-4 mr-1.5 text-amber-500" />
            Rotationsplan drucken
          </button>

          <button
            type="button"
            onClick={onPrintQualiTotal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow-lg transition"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Quali-Wertung A4 drucken
          </button>
        </div>
      </div>

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

          const sortedGroupDrivers = [...group.drivers].sort((a, b) => {
            if (!sortByTotalTime) return a.id - b.id;
            const stA = standings.find((s) => s.driverId === a.id);
            const stB = standings.find((s) => s.driverId === b.id);
            return (stA?.rank ?? 999) - (stB?.rank ?? 999);
          });

          return (
            <div key={group.id} className={`p-5 rounded-2xl border shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#535353]/30">
                <div className="flex items-center space-x-3">
                  <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-black text-base">
                    {group.name}
                  </span>
                  <div className="text-sm font-black">
                    {group.drivers.length} Fahrer • Zugeteilte Karts:{' '}
                    <span className="text-amber-400 font-mono">
                      {group.assignedKarts.slice(0, group.drivers.length).join(', ')}
                    </span>
                  </div>
                </div>

                {!liveScreenMode && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onAssignGroupKarts(
                          group.name,
                          activeKarts.slice(0, group.drivers.length).map((k) => k.name)
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
                    >
                      <ListOrdered className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      1..{group.drivers.length}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const shuffled = [...activeKarts]
                          .sort(() => Math.random() - 0.5)
                          .slice(0, group.drivers.length)
                          .map((k) => k.name);
                        onAssignGroupKarts(group.name, shuffled);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
                    >
                      <Shuffle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      Auslosen
                    </button>
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
                              ? 'bg-emerald-500 text-black border-emerald-500 font-black'
                              : c.karasState === 'stopped'
                              ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                              : subBg
                          }`}
                        >
                          {isCurrent ? (
                            <Play className="w-3 h-3 fill-black mr-1" />
                          ) : c.karasState === 'stopped' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : null}
                          <span>Lauf {tIdx + 1} öffnen</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!liveScreenMode && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold opacity-75 mr-1">
                    🎯 Gruppen-Karts ({group.name}) per Klick wählen:
                  </span>
                  {activeKarts.map((k) => {
                    const selected = group.assignedKarts
                      .slice(0, group.drivers.length)
                      .includes(k.name);
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => handleToggleGroupKart(group, k.name)}
                        className={`px-2.5 py-1 rounded-lg font-mono font-black border transition ${
                          selected
                            ? 'bg-amber-500 text-black border-amber-500 shadow'
                            : 'opacity-50 hover:opacity-100 border-[#535353]'
                        }`}
                      >
                        {k.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase ${subBg}`}>
                      <th className="p-2.5 w-16 text-center">Pos</th>
                      <th className="p-2.5 w-20 text-center">Gesamt</th>
                      <th className="p-2.5 min-w-[180px]">Fahrer</th>
                      {Array.from({ length: qualiTurns }, (_, t) => {
                        const card = groupQualiCards[t];
                        const isCurrent = card && cards[activeCardIndex]?.id === card.id;
                        return (
                          <th
                            key={t}
                            className={`p-2.5 text-center min-w-[115px] ${
                              isCurrent
                                ? 'bg-emerald-500/25 text-emerald-400 border-b-2 border-emerald-500'
                                : ''
                            }`}
                          >
                            <div>Lauf {t + 1}</div>
                          </th>
                        );
                      })}
                      <th className="p-2.5 text-right w-28">Beste Rd.</th>
                      <th className="p-2.5 text-right w-32">Gesamtzeit</th>
                      <th className="p-2.5 text-center w-36">Finale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#535353]/25">
                    {sortedGroupDrivers.map((driver, posIdx) => {
                      const st = standings.find((s) => s.driverId === driver.id);
                      return (
                        <tr key={driver.id} className="hover:bg-amber-500/5 transition">
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
                          <td className="p-2.5 font-black text-base">{driver.name}</td>
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
                                <div className="inline-flex flex-col items-center">
                                  <select
                                    value={entry?.kartName || ''}
                                    onChange={(e) =>
                                      handleCellKartChange(
                                        card,
                                        driver.id,
                                        e.target.value
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black text-center cursor-pointer ${
                                      isCurrent
                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                        : hasTime
                                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                        : subBg
                                    }`}
                                  >
                                    {activeKarts.map((k) => (
                                      <option
                                        key={k.id}
                                        value={k.name}
                                        className="bg-[#1A1A1A] text-white"
                                      >
                                        {k.name}
                                      </option>
                                    ))}
                                  </select>
                                  {showTimesInCells && hasTime && (
                                    <span className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                                      {Number(entry?.bestTime).toFixed(3)} s
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-right font-mono text-xs font-bold">
                            {st?.bestLap ? `${st.bestLap.toFixed(3)} s` : '–'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-amber-500">
                            {st?.totalTime ? `${st.totalTime.toFixed(3)} s` : '–'}
                          </td>
                          <td className="p-2.5 text-center">
                            {st?.targetFinalName ? (
                              <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                {st.targetFinalName.replace('Finale ', '')} (P
                                {st.targetGridPos})
                              </span>
                            ) : (
                              '–'
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
