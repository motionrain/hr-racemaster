// src/components/StepFinals.tsx
import React from 'react';
import { Trophy, Plus, Minus, Printer, Shuffle, ListOrdered } from 'lucide-react';
import { KartItem, OverallDriverStanding, SessionCard } from '../types/kart';
import { sortSessionEntries } from '../lib/raceLogic';

interface StepFinalsProps {
  darkMode: boolean;
  standings: OverallDriverStanding[];
  finalCards: SessionCard[];
  activeKarts: KartItem[];
  onUpdateFinalCard: (updated: SessionCard) => void;
  onRegenerateFinals: () => void;
  onOpenPrint: () => void;
}

export default function StepFinals({
  darkMode,
  standings,
  finalCards,
  activeKarts,
  onUpdateFinalCard,
  onRegenerateFinals,
  onOpenPrint,
}: StepFinalsProps) {
  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  const adjustLaps = (card: SessionCard, driverId: number, delta: number) => {
    const updated = card.entries.map((e) =>
      e.driverId === driverId ? { ...e, laps: Math.max(0, e.laps + delta) } : e
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
    const updated = card.entries.map((e) =>
      e.driverId === driverId ? { ...e, kartName: newKart } : e
    );
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

  return (
    <div className="space-y-6">
      {/* Header-Leiste */}
      <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <h2 className="text-xl font-black flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-amber-500" />
            Finalläufe (Gruppenaufteilung nach Gesamtzeit • Wertung nach Rundenanzahl)
          </h2>
          <p className="text-xs opacity-75">
            Die Startaufstellung (Pole P1, P2...) wurde automatisch aus den Qualifying-Ergebnissen gebildet.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onRegenerateFinals}
            className={`px-4 py-2 rounded-xl text-xs font-bold border ${subBg}`}
          >
            Startaufstellung neu berechnen
          </button>
          <button
            type="button"
            onClick={onOpenPrint}
            className="px-5 py-2 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center shadow"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            A4 Aushang & Urkunden
          </button>
        </div>
      </div>

      {/* Final-Karten (A-Finale, B-Finale, C-Finale) */}
      <div className="grid grid-cols-1 gap-6">
        {finalCards.map((card) => {
          const sorted = sortSessionEntries(card);
          return (
            <div key={card.id} className={`p-6 rounded-2xl border shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#535353]/30">
                <div>
                  <h3 className="text-lg font-black text-amber-500">{card.title}</h3>
                  <p className="text-xs opacity-70">{card.subtitle}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => assignSequential(card)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
                  >
                    <ListOrdered className="w-3.5 h-3.5 mr-1" /> Karts 1, 2, 3...
                  </button>
                  <button
                    type="button"
                    onClick={() => assignRandom(card)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1" /> Karts auslosen
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase ${subBg}`}>
                      <th className="p-3 w-16 text-center">Platz</th>
                      <th className="p-3 w-20 text-center">Grid</th>
                      <th className="p-3">Fahrer</th>
                      <th className="p-3 w-40">Kart</th>
                      <th className="p-3 text-center w-48">Rundenanzahl (Wertung)</th>
                      <th className="p-3 text-right w-40">Beste Runde [s]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#535353]/25">
                    {sorted.map((entry, idx) => (
                      <tr key={entry.driverId}>
                        <td className="p-3 text-center font-black">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                              idx === 0 ? 'bg-amber-500 text-black' : subBg
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-xs opacity-75">
                          Pole P{entry.gridPos}
                        </td>
                        <td className="p-3 font-bold">{entry.driverName}</td>
                        <td className="p-3">
                          <select
                            value={entry.kartName}
                            onChange={(e) =>
                              handleKartChange(card, entry.driverId, e.target.value)
                            }
                            className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${subBg}`}
                          >
                            {activeKarts.map((k) => (
                              <option key={k.id} value={k.name}>
                                {k.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => adjustLaps(card, entry.driverId, -1)}
                              className={`p-1.5 rounded-lg border ${subBg}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-12 text-center font-mono font-black text-base text-amber-500">
                              {entry.laps}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustLaps(card, entry.driverId, 1)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-xs flex items-center"
                            >
                              <Plus className="w-3.5 h-3.5 mr-0.5" /> 1
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="text"
                            placeholder="00.000"
                            value={entry.bestTime}
                            onChange={(e) =>
                              handleBestTime(card, entry.driverId, e.target.value)
                            }
                            className={`w-28 px-2.5 py-1 rounded-lg border text-right font-mono text-xs font-bold ${subBg}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Übersicht der Qualifying-Gesamtwertung als Referenz */}
      <div className={`p-6 rounded-2xl border ${cardBg}`}>
        <h3 className="text-base font-black mb-3">
          Qualifying-Gesamtwertung (Basis für die Final-Einteilung)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b uppercase ${subBg}`}>
                <th className="p-2.5">Rang</th>
                <th className="p-2.5">Fahrer</th>
                <th className="p-2.5">Vorlauf-Gruppe</th>
                <th className="p-2.5 text-right">Beste Einzelrunde</th>
                <th className="p-2.5 text-right">Gesamtzeit (Alle Läufe)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#535353]/25">
              {standings.map((st) => (
                <tr key={st.driverId}>
                  <td className="p-2.5 font-black text-amber-500">#{st.rank}</td>
                  <td className="p-2.5 font-bold">{st.driverName}</td>
                  <td className="p-2.5 opacity-75">{st.groupName}</td>
                  <td className="p-2.5 text-right font-mono">
                    {st.bestLap ? `${st.bestLap.toFixed(3)} s` : '–'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black">
                    {st.totalTime ? `${st.totalTime.toFixed(3)} s` : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
