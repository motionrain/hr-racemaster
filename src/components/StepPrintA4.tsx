// src/components/StepPrintA4.tsx
import React, { useState } from 'react';
import { Printer, Award, FileText, Table, Flag, Grid, Trophy } from 'lucide-react';
import {
  OverallDriverStanding,
  PrintViewMode,
  RaceGroup,
  SessionCard,
} from '../types/kart';
import {
  sortSessionEntries,
  calculateCombinedFinalStandings,
} from '../lib/raceLogic';

interface StepPrintA4Props {
  darkMode: boolean;
  eventName: string;
  printMode: PrintViewMode;
  setPrintMode: (m: PrintViewMode) => void;
  groups: RaceGroup[];
  currentCard: SessionCard | undefined;
  allCards: SessionCard[];
  standings: OverallDriverStanding[];
  finalCards: SessionCard[];
  selectedFinalIndex: number;
  setSelectedFinalIndex: (idx: number) => void;
  qualiTurns: number;
}

export default function StepPrintA4({
  darkMode,
  eventName,
  printMode,
  setPrintMode,
  groups,
  currentCard,
  allCards,
  standings,
  finalCards,
  selectedFinalIndex,
  setSelectedFinalIndex,
  qualiTurns,
}: StepPrintA4Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<number>(
    standings[0]?.driverId || 1
  );
  const [qualiMatrixMode, setQualiMatrixMode] = useState<
    'overall_matrix' | 'group_matrix' | 'both'
  >('both');
  const [hideEmptyKartsOnPrint, setHideEmptyKartsOnPrint] = useState<boolean>(true);

  const selectedStanding =
    standings.find((s) => s.driverId === selectedDriverId) || standings[0];

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#E6E6E6] border-[#D3D3D3] text-[#1A1A1A]';

  const combinedFinals = calculateCombinedFinalStandings(
    finalCards,
    'tiered',
    hideEmptyKartsOnPrint
  );
  const singleFinalCard = finalCards[selectedFinalIndex] || finalCards[0];

  const filteredStandings =
    hideEmptyKartsOnPrint && standings.some((s) => s.hasAnyActivity)
      ? standings.filter((s) => s.hasAnyActivity)
      : standings;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 print:hidden ${
          darkMode
            ? 'bg-[#1A1A1A] border-[#272727] text-white'
            : 'bg-white border-[#D3D3D3] text-black'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'quali_total', label: '1. Quali-Gesamtwertung', icon: Table },
            { id: 'rolling_plan', label: '2. Rotationsplan (Boxengasse)', icon: Grid },
            { id: 'current_card', label: '3. Aktueller Lauf', icon: FileText },
            { id: 'final_group', label: '4. Finale Einzelgruppe', icon: Flag },
            { id: 'final_overall', label: '5. Finale Gesamtwertung', icon: Trophy },
            { id: 'certificate', label: '6. Sieger-Urkunde (A4)', icon: Award },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPrintMode(btn.id as PrintViewMode)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition ${
                  printMode === btn.id ? 'bg-amber-500 text-black shadow' : subBg
                }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {btn.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {printMode !== 'rolling_plan' && printMode !== 'certificate' && (
            <label className="flex items-center space-x-2 text-xs font-black cursor-pointer px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <input
                type="checkbox"
                checked={hideEmptyKartsOnPrint}
                onChange={(e) => setHideEmptyKartsOnPrint(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Nur aktive Transponder drucken (Leere Karts ausblenden)</span>
            </label>
          )}

          {printMode === 'quali_total' && (
            <div className="flex items-center space-x-1">
              {[
                { id: 'both', label: 'Beide Tabellen' },
                { id: 'group_matrix', label: 'Nur Gruppen' },
                { id: 'overall_matrix', label: 'Nur Gesamt (#1–#N)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setQualiMatrixMode(
                      opt.id as 'overall_matrix' | 'group_matrix' | 'both'
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${
                    qualiMatrixMode === opt.id
                      ? 'bg-amber-500 text-black border-amber-500'
                      : subBg
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {printMode === 'final_group' && finalCards.length > 0 && (
            <select
              value={selectedFinalIndex}
              onChange={(e) => setSelectedFinalIndex(Number(e.target.value))}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${subBg}`}
            >
              {finalCards.map((fc, idx) => (
                <option key={fc.id} value={idx}>
                  {idx + 1}. Lauf: {fc.title}
                </option>
              ))}
            </select>
          )}

          {printMode === 'certificate' && (
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(Number(e.target.value))}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${subBg}`}
            >
              {standings.map((s) => (
                <option key={s.driverId} value={s.driverId}>
                  Platz #{s.rank} – {s.driverName}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center shadow-lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            DIN-A4 DRUCKEN
          </button>
        </div>
      </div>

      {/* DIN-A4 DRUCKBLATT (GROSSE SCHRIFT & DEUTLICHE KART-BOXEN) */}
      <div className="bg-white text-black p-6 sm:p-8 rounded-2xl shadow-xl max-w-[210mm] mx-auto print:shadow-none print:p-0 print:max-w-none">
        <div className="border-b-4 border-black pb-3 mb-5 flex justify-between items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-neutral-600">
              KARTBAHN RHEINFELDEN • HR-RACEMASTER TIMING
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight mt-0.5">
              {eventName}
            </h1>
          </div>
          <div className="text-right text-xs font-mono font-bold text-neutral-700">
            <div>Datum: {new Date().toLocaleDateString('de-DE')}</div>
            <div>System: HR-RaceMaster Live</div>
          </div>
        </div>

        {/* 1. QUALIFYING GESAMTWERTUNG */}
        {printMode === 'quali_total' && (
          <div className="space-y-6">
            {(qualiMatrixMode === 'group_matrix' || qualiMatrixMode === 'both') && (
              <div className="space-y-5">
                {groups.map((group) => {
                  const groupStandings = filteredStandings
                    .filter((s) => s.groupName === group.name)
                    .sort((a, b) => a.rank - b.rank);
                  if (groupStandings.length === 0) return null;

                  return (
                    <div
                      key={group.id}
                      className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid"
                    >
                      <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-sm font-black uppercase">
                        <span>{group.name} – Wertung ({groupStandings.length} Fahrer)</span>
                        <span>Sortiert nach Gesamtzeit</span>
                      </div>

                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                            <th className="py-2 px-2 text-center w-14 border-r border-black">Pos</th>
                            <th className="py-2 px-3 text-left border-r border-black">Fahrername</th>
                            {Array.from({ length: qualiTurns }, (_, t) => (
                              <th key={t} className="py-2 px-2 text-center border-r border-black">
                                Lauf {t + 1}
                              </th>
                            ))}
                            <th className="py-2 px-2 text-right border-r border-black w-24">Beste Rd.</th>
                            <th className="py-2 px-2 text-right border-r border-black w-28 bg-neutral-300">
                              Gesamtzeit
                            </th>
                            <th className="py-2 px-2 text-center w-28">Finale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {groupStandings.map((st, idx) => (
                            <tr key={st.driverId}>
                              <td className="py-2 px-2 text-center font-black text-base border-r border-black bg-neutral-100">
                                P{idx + 1}
                              </td>
                              <td className="py-2 px-3 font-black text-lg border-r border-black">
                                {st.driverName}
                              </td>
                              {st.turnTimes.map((tVal, tIdx) => (
                                <td
                                  key={tIdx}
                                  className="py-1.5 px-2 text-center font-mono border-r border-black"
                                >
                                  <span className="inline-block px-2.5 py-0.5 rounded border-2 border-black bg-neutral-100 font-black text-xs uppercase mb-0.5">
                                    {st.turnKarts[tIdx]}
                                  </span>
                                  <div className="font-black text-sm">
                                    {tVal ? `${tVal.toFixed(3)}s` : '–'}
                                  </div>
                                </td>
                              ))}
                              <td className="py-2 px-2 text-right font-mono font-bold text-sm border-r border-black">
                                {st.bestLap ? `${st.bestLap.toFixed(3)}s` : '–'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-black text-base border-r border-black bg-neutral-100">
                                {st.totalTime ? `${st.totalTime.toFixed(3)}s` : '–'}
                              </td>
                              <td className="py-2 px-2 text-center font-black text-xs">
                                {st.targetFinalName.replace('Finale ', '')} • P{st.targetGridPos}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            {(qualiMatrixMode === 'overall_matrix' || qualiMatrixMode === 'both') && (
              <div className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid">
                <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-sm font-black uppercase">
                  <span>Gesamtrangliste Qualifying (Platz #1 bis #{filteredStandings.length})</span>
                  <span>Basis für Finaleinteilung</span>
                </div>

                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                      <th className="py-2 px-2 text-center w-14 border-r border-black">Rang</th>
                      <th className="py-2 px-3 text-left border-r border-black">Fahrername</th>
                      <th className="py-2 px-2 text-center w-20 border-r border-black">Gruppe</th>
                      {Array.from({ length: qualiTurns }, (_, t) => (
                        <th key={t} className="py-2 px-2 text-center border-r border-black">
                          Lauf {t + 1}
                        </th>
                      ))}
                      <th className="py-2 px-2 text-right border-r border-black w-24">Beste Rd.</th>
                      <th className="py-2 px-2 text-right border-r border-black w-28 bg-neutral-300">
                        Gesamtzeit
                      </th>
                      <th className="py-2 px-2 text-center w-32">Qualifiziert für</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredStandings.map((st, idx) => (
                      <tr key={st.driverId}>
                        <td className="py-2 px-2 text-center font-mono font-black text-base border-r border-black bg-neutral-100">
                          #{idx + 1}
                        </td>
                        <td className="py-2 px-3 font-black text-lg border-r border-black">
                          {st.driverName}
                        </td>
                        <td className="py-2 px-2 text-center font-bold border-r border-black">
                          {st.groupName.replace('Gruppe ', 'Gr. ')}
                        </td>
                        {st.turnTimes.map((tVal, tIdx) => (
                          <td
                            key={tIdx}
                            className="py-1.5 px-2 text-center font-mono border-r border-black"
                          >
                            <span className="inline-block px-2.5 py-0.5 rounded border-2 border-black bg-neutral-100 font-black text-xs uppercase mb-0.5">
                              {st.turnKarts[tIdx]}
                            </span>
                            <div className="font-black text-sm">
                              {tVal ? `${tVal.toFixed(3)}s` : '–'}
                            </div>
                          </td>
                        ))}
                        <td className="py-2 px-2 text-right font-mono font-bold text-sm border-r border-black">
                          {st.bestLap ? `${st.bestLap.toFixed(3)}s` : '–'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-black text-base border-r border-black bg-neutral-100">
                          {st.totalTime ? `${st.totalTime.toFixed(3)}s` : '–'}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-xs">
                          {st.targetFinalName.replace('Finale ', '')} (Pole P{st.targetGridPos})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. VORAB-ROTATIONSPLAN */}
        {printMode === 'rolling_plan' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase">
                Gruppen- & Kart-Einteilung (Boxengassen-Aushang)
              </h2>
              <p className="text-sm font-bold text-neutral-700">
                Bitte vor jedem Lauf das zugeteilte Kart in der Tabelle ablesen!
              </p>
            </div>

            {groups.map((group) => {
              const groupQualiCards = Array.from({ length: qualiTurns }, (_, t) =>
                allCards.find(
                  (c) =>
                    c.kind === 'quali' &&
                    c.groupName === group.name &&
                    c.turnIndex === t
                )
              );

              return (
                <div
                  key={group.id}
                  className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid"
                >
                  <div className="bg-black text-white px-4 py-2.5 flex justify-between items-center text-base font-black uppercase">
                    <span>
                      {group.name} ({group.drivers.length} Fahrer)
                    </span>
                    <span>Kart-Zuteilung für Lauf 1 bis {qualiTurns}</span>
                  </div>

                  <table className="w-full text-base border-collapse">
                    <thead>
                      <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                        <th className="py-2.5 px-2 text-center w-16 border-r border-black">
                          Nr.
                        </th>
                        <th className="py-2.5 px-3 text-left border-r border-black">
                          Fahrername
                        </th>
                        {Array.from({ length: qualiTurns }, (_, t) => (
                          <th
                            key={t}
                            className="py-2.5 px-2 text-center border-r border-black last:border-r-0"
                          >
                            Lauf {t + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {group.drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td className="py-2.5 px-2 text-center font-mono font-black text-base border-r border-black bg-neutral-100">
                            #{driver.id}
                          </td>
                          <td className="py-2.5 px-3 font-black text-lg border-r border-black">
                            {driver.name}
                          </td>
                          {Array.from({ length: qualiTurns }, (_, t) => {
                            const card = groupQualiCards[t];
                            const entry = card?.entries.find(
                              (e) => e.driverId === driver.id
                            );
                            return (
                              <td
                                key={t}
                                className="py-2 px-2 text-center border-r border-black last:border-r-0"
                              >
                                <span className="inline-block px-3 py-1 rounded-md border-2 border-black bg-neutral-100 font-mono font-black text-base uppercase">
                                  {entry?.kartName || '–'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. AKTUELLER EINZELLAUF */}
        {printMode === 'current_card' && currentCard && (
          <div className="border-2 border-black rounded-lg overflow-hidden">
            <div className="bg-black text-white px-4 py-3 flex justify-between items-center">
              <span className="font-black uppercase text-lg">{currentCard.title}</span>
              <span className="text-xs font-mono font-bold">Offizielles Laufergebnis</span>
            </div>
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                  <th className="py-2.5 px-3 text-center w-20 border-r border-black">Platz</th>
                  <th className="py-2.5 px-4 text-left border-r border-black">Fahrername</th>
                  <th className="py-2.5 px-3 text-center w-36 border-r border-black">Kart</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-black">Runden</th>
                  <th className="py-2.5 px-4 text-right w-44">Schnellste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {sortSessionEntries(currentCard, hideEmptyKartsOnPrint).map((e, idx) => (
                  <tr key={e.driverId}>
                    <td className="py-3 px-3 text-center font-black text-lg border-r border-black bg-neutral-100">
                      P{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-black text-xl border-r border-black">
                      {e.driverName}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-black">
                      <span className="inline-block px-3.5 py-1 rounded-md border-2 border-black bg-neutral-100 font-mono font-black text-base uppercase">
                        {e.kartName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-lg border-r border-black">
                      {e.laps}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-xl">
                      {e.bestTime ? `${Number(e.bestTime).toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. EINZELWERTUNG FINALE GRUPPE */}
        {printMode === 'final_group' && singleFinalCard && (
          <div className="border-2 border-black rounded-lg overflow-hidden">
            <div className="bg-black text-white px-4 py-3 flex justify-between items-center text-base font-black uppercase">
              <span>{singleFinalCard.title}</span>
              <span>Wertung nach Rundenanzahl</span>
            </div>
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                  <th className="py-2.5 px-3 text-center w-20 border-r border-black">Platz</th>
                  <th className="py-2.5 px-3 text-center w-28 border-r border-black">Grid</th>
                  <th className="py-2.5 px-4 text-left border-r border-black">Fahrername</th>
                  <th className="py-2.5 px-3 text-center w-36 border-r border-black">Kart</th>
                  <th className="py-2.5 px-3 text-center w-32 border-r border-black bg-neutral-300">
                    Runden
                  </th>
                  <th className="py-2.5 px-4 text-right w-40">Beste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {sortSessionEntries(singleFinalCard, hideEmptyKartsOnPrint).map((e, idx) => (
                  <tr key={e.driverId}>
                    <td className="py-3 px-3 text-center font-black text-lg border-r border-black bg-neutral-100">
                      P{idx + 1}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-sm border-r border-black">
                      Pole P{e.gridPos}
                    </td>
                    <td className="py-3 px-4 font-black text-xl border-r border-black">
                      {e.driverName}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-black">
                      <span className="inline-block px-3.5 py-1 rounded-md border-2 border-black bg-neutral-100 font-mono font-black text-base uppercase">
                        {e.kartName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-lg border-r border-black bg-neutral-100">
                      {e.laps} Rd.
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-lg">
                      {e.bestTime ? `${Number(e.bestTime).toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. GESAMTWERTUNG FINALE */}
        {printMode === 'final_overall' && (
          <div className="space-y-6">
            <div className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid">
              <div className="bg-black text-white px-4 py-2.5 flex justify-between items-center text-base font-black uppercase">
                <span>Offizielles Endergebnis Finale (Platz #1 bis #{combinedFinals.length})</span>
                <span>Alle Finalgruppen kombiniert</span>
              </div>
              <table className="w-full text-base border-collapse">
                <thead>
                  <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                    <th className="py-2.5 px-3 text-center w-20 border-r border-black">Rang</th>
                    <th className="py-2.5 px-4 text-left border-r border-black">Fahrername</th>
                    <th className="py-2.5 px-3 text-center w-40 border-r border-black">Final-Gruppe</th>
                    <th className="py-2.5 px-3 text-center w-32 border-r border-black">Kart</th>
                    <th className="py-2.5 px-3 text-center w-28 border-r border-black bg-neutral-300">
                      Runden
                    </th>
                    <th className="py-2.5 px-4 text-right w-36">Beste Runde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {combinedFinals.map((row) => (
                    <tr key={row.driverId}>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-lg border-r border-black bg-neutral-100">
                        #{row.overallRank}
                      </td>
                      <td className="py-2.5 px-4 font-black text-lg border-r border-black">
                        {row.driverName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-sm border-r border-black">
                        {row.finalGroupName.replace('Finale ', '')} (P{row.groupRank})
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-black">
                        <span className="inline-block px-3 py-0.5 rounded border-2 border-black bg-neutral-100 font-mono font-black text-sm uppercase">
                          {row.kartName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-base border-r border-black bg-neutral-100">
                        {row.laps} Rd.
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-base">
                        {row.bestTime ? `${Number(row.bestTime).toFixed(3)} s` : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. SIEGER-URKUNDE */}
        {printMode === 'certificate' && selectedStanding && (
          <div className="border-8 border-double border-black p-10 text-center my-4">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500 mb-2">
              OFFIZIELLES RENNSPORT-DIPLOM • KARTBAHN RHEINFELDEN
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tight mb-6">
              SIEGER-URKUNDE
            </h2>
            <p className="text-sm text-neutral-600 mb-2">
              Verliehen beim Wettbewerb <strong>{eventName}</strong> an
            </p>
            <div className="text-4xl font-black text-black border-b-2 border-black inline-block px-8 pb-2 mb-6">
              {selectedStanding.driverName}
            </div>
            <div className="my-6">
              <span className="bg-black text-white text-3xl font-black px-8 py-3 rounded-xl inline-block uppercase tracking-wider">
                {selectedStanding.rank}. PLATZ
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto my-8 text-left border-t border-b border-neutral-300 py-4">
              <div>
                <div className="text-xs uppercase text-neutral-500 font-bold">
                  Schnellste Einzelrunde
                </div>
                <div className="text-xl font-mono font-black">
                  {selectedStanding.bestLap
                    ? `${selectedStanding.bestLap.toFixed(3)} Sek.`
                    : '–'}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-neutral-500 font-bold">
                  Gesamtzeit ({selectedStanding.completedTurns} Läufe)
                </div>
                <div className="text-xl font-mono font-black">
                  {selectedStanding.totalTime
                    ? `${selectedStanding.totalTime.toFixed(3)} Sek.`
                    : '–'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
