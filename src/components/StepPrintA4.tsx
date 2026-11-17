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
  // Layout-Wahl für Quali-Gesamtwertung: 'both' | 'overall_matrix' | 'group_matrix'
  const [qualiMatrixMode, setQualiMatrixMode] = useState<
    'overall_matrix' | 'group_matrix' | 'both'
  >('both');
  const [showKartInQualiTotal, setShowKartInQualiTotal] = useState<boolean>(true);

  const selectedStanding =
    standings.find((s) => s.driverId === selectedDriverId) || standings[0];

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#E6E6E6] border-[#D3D3D3] text-[#1A1A1A]';

  const combinedFinals = calculateCombinedFinalStandings(finalCards, 'tiered');
  const singleFinalCard = finalCards[selectedFinalIndex] || finalCards[0];

  return (
    <div className="space-y-6">
      {/* Auswahlleiste (wird beim Drucken ausgeblendet) */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 print:hidden ${
          darkMode
            ? 'bg-[#1A1A1A] border-[#272727] text-white'
            : 'bg-white border-[#D3D3D3] text-black'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {[
            {
              id: 'quali_total',
              label: '1. Quali-Gesamtwertung (Matrix)',
              icon: Table,
            },
            {
              id: 'rolling_plan',
              label: '2. Rotationsplan (Vorab-Aushang)',
              icon: Grid,
            },
            { id: 'current_card', label: '3. Aktueller Lauf', icon: FileText },
            {
              id: 'final_group',
              label: '4. Finale Einzelgruppe (z.B. Gr. B)',
              icon: Flag,
            },
            {
              id: 'final_overall',
              label: '5. Finale Gesamtwertung (Alle)',
              icon: Trophy,
            },
            { id: 'certificate', label: '6. Sieger-Urkunde (A4)', icon: Award },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPrintMode(btn.id as PrintViewMode)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition ${
                  printMode === btn.id
                    ? 'bg-amber-500 text-black shadow'
                    : subBg
                }`}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Kontext-Optionen je nach Druckansicht */}
        <div className="flex flex-wrap items-center gap-3">
          {printMode === 'quali_total' && (
            <>
              <div className="flex items-center space-x-1">
                {[
                  { id: 'both', label: 'Gesamt + Gruppen-Matrix' },
                  { id: 'group_matrix', label: 'Nur Gruppen-Matrix (nach Zeit)' },
                  { id: 'overall_matrix', label: 'Nur Gesamt-Matrix (#1–#N)' },
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

              <label className="flex items-center space-x-1.5 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showKartInQualiTotal}
                  onChange={(e) => setShowKartInQualiTotal(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Kart-Nr. je Lauf anzeigen</span>
              </label>
            </>
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

      {/* DIN-A4 DRUCKBLATT */}
      <div className="bg-white text-black p-6 sm:p-8 rounded-2xl shadow-xl max-w-[210mm] mx-auto print:shadow-none print:p-0 print:max-w-none">
        {/* Motorsport Header */}
        <div className="border-b-4 border-black pb-3 mb-5 flex justify-between items-end">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
              KARTBAHN RHEINFELDEN • HR-RACEMASTER TIMING
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-0.5">
              {eventName}
            </h1>
          </div>
          <div className="text-right text-xs font-mono text-neutral-600">
            <div>Datum: {new Date().toLocaleDateString('de-DE')}</div>
            <div>System: HR-RaceMaster Live</div>
          </div>
        </div>

        {/* =====================================================================
            1. QUALIFYING GESAMTWERTUNG (IM ÜBERSICHTLICHEN GRUPPEN-MATRIX-DESIGN)
           ===================================================================== */}
        {printMode === 'quali_total' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black uppercase">
                Offizieller Wertungsaushang – Qualifying Gesamtauswertung
              </h2>
              <p className="text-xs text-neutral-600">
                Fahrer-Positionen sortiert nach der schnellsten Gesamtzeit über alle {qualiTurns} Qualifying-Läufe.
              </p>
            </div>

            {/* TEIL A: GRUPPEN-MATRIX (SORTIERT NACH SCHNELLSTER GESAMTZEIT) */}
            {(qualiMatrixMode === 'group_matrix' ||
              qualiMatrixMode === 'both') && (
              <div className="space-y-4">
                {groups.map((group) => {
                  // Filtere & sortiere die Fahrer dieser Gruppe nach ihrer Gesamtzeit-Position (st.rank)
                  const groupStandings = standings
                    .filter((s) => s.groupName === group.name)
                    .sort((a, b) => a.rank - b.rank);

                  return (
                    <div
                      key={group.id}
                      className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid"
                    >
                      <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                        <span>
                          {group.name} – Sortiert nach schnellster Gesamtzeit ({groupStandings.length} Fahrer)
                        </span>
                        <span>
                          {qualiTurns} Läufe • Qualifying-Auswertung
                        </span>
                      </div>

                      <table className="w-full text-[10.5px] border-collapse">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                            <th className="py-1.5 px-1.5 text-center w-11 border-r border-neutral-300">
                              Pos
                            </th>
                            <th className="py-1.5 px-1.5 text-center w-14 border-r border-neutral-300">
                              Gesamt
                            </th>
                            <th className="py-1.5 px-2 text-left border-r border-neutral-300 min-w-[120px]">
                              Fahrer
                            </th>
                            {Array.from({ length: qualiTurns }, (_, t) => (
                              <th
                                key={t}
                                className="py-1.5 px-1 text-center border-r border-neutral-300"
                              >
                                Lauf {t + 1}
                              </th>
                            ))}
                            <th className="py-1.5 px-1.5 text-right border-r border-neutral-300 w-16">
                              Beste Rd.
                            </th>
                            <th className="py-1.5 px-2 text-right border-r border-neutral-300 w-20 bg-neutral-200">
                              Gesamtzeit
                            </th>
                            <th className="py-1.5 px-2 text-center w-24">
                              Finale / Grid
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-300">
                          {groupStandings.map((st, idx) => (
                            <tr key={st.driverId}>
                              <td className="py-1.5 px-1.5 text-center font-black border-r border-neutral-300 bg-neutral-50">
                                P{idx + 1}
                              </td>
                              <td className="py-1.5 px-1.5 text-center font-mono font-bold border-r border-neutral-300">
                                #{st.rank}
                              </td>
                              <td className="py-1.5 px-2 font-bold border-r border-neutral-300">
                                {st.driverName}
                              </td>
                              {st.turnTimes.map((tVal, tIdx) => (
                                <td
                                  key={tIdx}
                                  className="py-1 px-1 text-center font-mono border-r border-neutral-300"
                                >
                                  {showKartInQualiTotal && (
                                    <div className="text-[9px] font-bold text-neutral-500 leading-tight">
                                      {st.turnKarts[tIdx]}
                                    </div>
                                  )}
                                  <div className="font-black leading-tight">
                                    {tVal ? `${tVal.toFixed(3)}s` : '–'}
                                  </div>
                                </td>
                              ))}
                              <td className="py-1.5 px-1.5 text-right font-mono border-r border-neutral-300">
                                {st.bestLap ? `${st.bestLap.toFixed(3)}s` : '–'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-black border-r border-neutral-300 bg-neutral-100">
                                {st.totalTime ? `${st.totalTime.toFixed(3)}s` : '–'}
                              </td>
                              <td className="py-1.5 px-1.5 text-center font-bold text-[10px]">
                                {st.targetFinalName.replace('Finale ', '')} • P
                                {st.targetGridPos}
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

            {/* TEIL B: GRUPPENÜBERGREIFENDE GESAMT-MATRIX (PLATZ #1 BIS #N NACH GESAMTZEIT) */}
            {(qualiMatrixMode === 'overall_matrix' ||
              qualiMatrixMode === 'both') && (
              <div className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid">
                <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                  <span>
                    Gesamtrangliste über alle Gruppen (Platz #1 bis #{standings.length} nach schnellster Gesamtzeit)
                  </span>
                  <span>Basis für Finaleinteilung (Gr. B startet vor Gr. A)</span>
                </div>

                <table className="w-full text-[10.5px] border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                      <th className="py-1.5 px-1.5 text-center w-12 border-r border-neutral-300">
                        Rang
                      </th>
                      <th className="py-1.5 px-2 text-left border-r border-neutral-300 min-w-[120px]">
                        Fahrer
                      </th>
                      <th className="py-1.5 px-1.5 text-center w-16 border-r border-neutral-300">
                        Vorlauf
                      </th>
                      {Array.from({ length: qualiTurns }, (_, t) => (
                        <th
                          key={t}
                          className="py-1.5 px-1 text-center border-r border-neutral-300"
                        >
                          Lauf {t + 1}
                        </th>
                      ))}
                      <th className="py-1.5 px-1.5 text-right border-r border-neutral-300 w-16">
                        Beste Rd.
                      </th>
                      <th className="py-1.5 px-2 text-right border-r border-neutral-300 w-20 bg-neutral-200">
                        Gesamtzeit
                      </th>
                      <th className="py-1.5 px-2 text-center w-28">
                        Qualifiziert für
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300">
                    {standings.map((st, idx) => {
                      const prevTarget =
                        idx > 0 ? standings[idx - 1].targetFinalName : st.targetFinalName;
                      const isNewFinalTier = idx > 0 && st.targetFinalName !== prevTarget;

                      return (
                        <tr
                          key={st.driverId}
                          className={isNewFinalTier ? 'border-t-2 border-black' : ''}
                        >
                          <td className="py-1.5 px-1.5 text-center font-mono font-black border-r border-neutral-300 bg-neutral-50">
                            #{st.rank}
                          </td>
                          <td className="py-1.5 px-2 font-bold border-r border-neutral-300">
                            {st.driverName}
                          </td>
                          <td className="py-1.5 px-1.5 text-center border-r border-neutral-300">
                            {st.groupName.replace('Gruppe ', 'Gr. ')}
                          </td>
                          {st.turnTimes.map((tVal, tIdx) => (
                            <td
                              key={tIdx}
                              className="py-1 px-1 text-center font-mono border-r border-neutral-300"
                            >
                              {showKartInQualiTotal && (
                                <div className="text-[9px] font-bold text-neutral-500 leading-tight">
                                  {st.turnKarts[tIdx]}
                                </div>
                              )}
                              <div className="font-black leading-tight">
                                {tVal ? `${tVal.toFixed(3)}s` : '–'}
                              </div>
                            </td>
                          ))}
                          <td className="py-1.5 px-1.5 text-right font-mono border-r border-neutral-300">
                            {st.bestLap ? `${st.bestLap.toFixed(3)}s` : '–'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-black border-r border-neutral-300 bg-neutral-100">
                            {st.totalTime ? `${st.totalTime.toFixed(3)}s` : '–'}
                          </td>
                          <td className="py-1.5 px-2 text-center font-black text-[10px]">
                            {st.targetFinalName.replace('Finale ', '')} (Pole P
                            {st.targetGridPos})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            2. VORAB-ROTATIONSPLAN (KART-MATRIX FÜR DIE BOXENGASSE)
           ===================================================================== */}
        {printMode === 'rolling_plan' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black uppercase">
                Offizieller Gruppen- & Kart-Rotationsplan (Boxengassen-Aushang)
              </h2>
              <p className="text-xs text-neutral-600">
                Jeder Fahrer wechselt nach jedem Lauf in das nächste zugeteilte Kart ({groups.length} Gruppen × {qualiTurns} Läufe).
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

              const hasRestingRow = groupQualiCards.some(
                (c) => c && c.restingKarts && c.restingKarts.length > 0
              );

              return (
                <div
                  key={group.id}
                  className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid"
                >
                  <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                    <span>
                      {group.name} ({group.drivers.length} Fahrer)
                    </span>
                    <span>{qualiTurns} Läufe • Kart-Zuteilung</span>
                  </div>

                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                        <th className="py-1.5 px-2 text-center w-14 border-r border-neutral-300">
                          Start-Nr.
                        </th>
                        <th className="py-1.5 px-2.5 text-left border-r border-neutral-300">
                          Fahrer
                        </th>
                        {Array.from({ length: qualiTurns }, (_, t) => (
                          <th
                            key={t}
                            className="py-1.5 px-1.5 text-center border-r border-neutral-300 last:border-r-0"
                          >
                            Lauf {t + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300">
                      {group.drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td className="py-1.5 px-2 text-center font-mono font-black border-r border-neutral-300">
                            {driver.id}
                          </td>
                          <td className="py-1.5 px-2.5 font-bold border-r border-neutral-300">
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
                                className="py-1.5 px-1.5 text-center font-mono font-black border-r border-neutral-300 last:border-r-0"
                              >
                                {entry?.kartName || '–'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {hasRestingRow && (
                        <tr className="bg-neutral-100 border-t-2 border-black font-bold">
                          <td className="py-1.5 px-2 text-center font-mono border-r border-neutral-300">
                            –
                          </td>
                          <td className="py-1.5 px-2.5 uppercase text-[10px] font-black border-r border-neutral-300">
                            Freies Kart (Pause in Box)
                          </td>
                          {Array.from({ length: qualiTurns }, (_, t) => {
                            const card = groupQualiCards[t];
                            const resting = card?.restingKarts || [];
                            return (
                              <td
                                key={t}
                                className="py-1.5 px-1.5 text-center font-mono font-black border-r border-neutral-300 last:border-r-0"
                              >
                                {resting.length > 0 ? resting.join(', ') : '–'}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* =====================================================================
            3. AKTUELLER EINZELLAUF (WARM-UP / QUALI)
           ===================================================================== */}
        {printMode === 'current_card' && currentCard && (
          <div className="border-2 border-black rounded-lg overflow-hidden">
            <div className="bg-black text-white px-4 py-2 flex justify-between items-center">
              <span className="font-black uppercase text-sm">
                {currentCard.title}
              </span>
              <span className="text-xs font-mono">{currentCard.subtitle}</span>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                  <th className="py-2 px-3 text-center w-16 border-r border-neutral-300">
                    Pos
                  </th>
                  <th className="py-2 px-3 text-left border-r border-neutral-300">
                    Fahrer
                  </th>
                  <th className="py-2 px-3 text-center w-28 border-r border-neutral-300">
                    Kart
                  </th>
                  <th className="py-2 px-3 text-center w-24 border-r border-neutral-300">
                    Runden
                  </th>
                  <th className="py-2 px-3 text-right w-36">
                    Schnellste Runde
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {sortSessionEntries(currentCard).map((e, idx) => (
                  <tr key={e.driverId}>
                    <td className="py-2 px-3 text-center font-black border-r border-neutral-300">
                      P{idx + 1}
                    </td>
                    <td className="py-2 px-3 font-bold border-r border-neutral-300">
                      {e.driverName}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold border-r border-neutral-300">
                      {e.kartName}
                    </td>
                    <td className="py-2 px-3 text-center font-mono border-r border-neutral-300">
                      {e.laps}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black">
                      {e.bestTime ? `${Number(e.bestTime).toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =====================================================================
            4. EINZELWERTUNG FINALE GRUPPE (Z. B. GRUPPE B DIREKT NACH ZIELDURCHFAHRT)
           ===================================================================== */}
        {printMode === 'final_group' && singleFinalCard && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black uppercase">
                Offizielle Einzelwertung – {singleFinalCard.title}
              </h2>
              <p className="text-xs text-neutral-600">
                Wertung nach Position / Rundenanzahl (Meiste Runden = Platz 1).
              </p>
            </div>

            <div className="border-2 border-black rounded-lg overflow-hidden">
              <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-xs font-black uppercase">
                <span>{singleFinalCard.title}</span>
                <span>Rennwertung nach Rundenanzahl</span>
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                    <th className="py-2 px-3 text-center w-20 border-r border-neutral-300">
                      Position
                    </th>
                    <th className="py-2 px-3 text-center w-28 border-r border-neutral-300">
                      Startplatz (Grid)
                    </th>
                    <th className="py-2 px-3 text-left border-r border-neutral-300">
                      Fahrer
                    </th>
                    <th className="py-2 px-3 text-center w-28 border-r border-neutral-300">
                      Kart
                    </th>
                    <th className="py-2 px-3 text-center w-32 border-r border-neutral-300 bg-neutral-200">
                      Runden (Wertung)
                    </th>
                    <th className="py-2 px-3 text-right w-32">
                      Schnellste Runde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300">
                  {sortSessionEntries(singleFinalCard).map((e, idx) => (
                    <tr key={e.driverId}>
                      <td className="py-2 px-3 text-center font-black border-r border-neutral-300 bg-neutral-50">
                        Platz {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-center font-mono border-r border-neutral-300">
                        Pole P{e.gridPos}{' '}
                        {e.qualiRank ? `(Quali #${e.qualiRank})` : ''}
                      </td>
                      <td className="py-2 px-3 font-bold border-r border-neutral-300">
                        {e.driverName}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r border-neutral-300">
                        {e.kartName}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black border-r border-neutral-300 bg-neutral-100">
                        {e.laps} Runden
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {e.bestTime ? `${Number(e.bestTime).toFixed(3)} s` : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            5. GESAMTWERTUNG FINALE (EINZELGRUPPEN B + A SOWIE GESAMTRANGLISTE)
           ===================================================================== */}
        {printMode === 'final_overall' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black uppercase">
                Offizielles Endergebnis – Finalläufe & Gesamtwertung
              </h2>
              <p className="text-xs text-neutral-600">
                Einzelwertungen der Finalgruppen (Startreihenfolge: Langsamste Gruppe zuerst) sowie Gesamtwertung über alle Fahrer.
              </p>
            </div>

            {/* Einzelwertungen jeder Gruppe in chronologischer Startreihenfolge (z.B. erst Gruppe B, dann Gruppe A) */}
            <div className="space-y-4">
              {finalCards.map((fc, fIdx) => (
                <div
                  key={fc.id}
                  className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid"
                >
                  <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                    <span>
                      {fIdx + 1}. Finallauf: {fc.title}
                    </span>
                    <span>Einzelwertung {fc.groupName} (nach Runden)</span>
                  </div>
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                        <th className="py-1.5 px-2 text-center w-20 border-r border-neutral-300">
                          Gruppen-Platz
                        </th>
                        <th className="py-1.5 px-2 text-center w-24 border-r border-neutral-300">
                          Startplatz
                        </th>
                        <th className="py-1.5 px-2.5 text-left border-r border-neutral-300">
                          Fahrer
                        </th>
                        <th className="py-1.5 px-2 text-center w-24 border-r border-neutral-300">
                          Kart
                        </th>
                        <th className="py-1.5 px-2 text-center w-28 border-r border-neutral-300 bg-neutral-200">
                          Runden
                        </th>
                        <th className="py-1.5 px-2 text-right w-28">
                          Beste Runde
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300">
                      {sortSessionEntries(fc).map((e, idx) => (
                        <tr key={e.driverId}>
                          <td className="py-1.5 px-2 text-center font-black border-r border-neutral-300 bg-neutral-50">
                            P{idx + 1}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono border-r border-neutral-300">
                            Pole P{e.gridPos}
                          </td>
                          <td className="py-1.5 px-2.5 font-bold border-r border-neutral-300">
                            {e.driverName}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono border-r border-neutral-300">
                            {e.kartName}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-black border-r border-neutral-300 bg-neutral-100">
                            {e.laps} Rd.
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            {e.bestTime
                              ? `${Number(e.bestTime).toFixed(3)} s`
                              : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Kombinierte Gesamtrangliste aller Finalgruppen */}
            <div className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid">
              <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                <span>
                  Gesamtwertung Finale – Alle Gruppen kombiniert (Platz #1 bis #{combinedFinals.length})
                </span>
                <span>Offizielles Endklassement</span>
              </div>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-black uppercase font-black">
                    <th className="py-1.5 px-2 text-center w-20 border-r border-neutral-300">
                      Gesamt-Rang
                    </th>
                    <th className="py-1.5 px-2.5 text-left border-r border-neutral-300">
                      Fahrer
                    </th>
                    <th className="py-1.5 px-2 text-center w-36 border-r border-neutral-300">
                      Final-Gruppe (Platz)
                    </th>
                    <th className="py-1.5 px-2 text-center w-24 border-r border-neutral-300">
                      Kart
                    </th>
                    <th className="py-1.5 px-2 text-center w-28 border-r border-neutral-300 bg-neutral-200">
                      Runden
                    </th>
                    <th className="py-1.5 px-2 text-right w-28">
                      Beste Runde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300">
                  {combinedFinals.map((row) => (
                    <tr key={row.driverId}>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-neutral-300 bg-neutral-50">
                        #{row.overallRank}
                      </td>
                      <td className="py-1.5 px-2.5 font-bold border-r border-neutral-300">
                        {row.driverName}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-neutral-300">
                        {row.finalGroupName.replace('Finale ', '')} • Platz{' '}
                        {row.groupRank}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono border-r border-neutral-300">
                        {row.kartName}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono font-black border-r border-neutral-300 bg-neutral-100">
                        {row.laps} Rd.
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {row.bestTime
                          ? `${Number(row.bestTime).toFixed(3)} s`
                          : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            6. MOTORSPORT SIEGER-URKUNDE (A4)
           ===================================================================== */}
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
            <div className="flex justify-between items-center text-xs text-neutral-500 pt-10 px-8">
              <div>Datum: {new Date().toLocaleDateString('de-DE')}</div>
              <div>Rennleitung • Kartbahn Rheinfelden</div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-3 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-500">
          <span>HR-RaceMaster • Offizieller Zeitnahme-Beleg</span>
          <span>© Copyright Hans Richter</span>
        </div>
      </div>
    </div>
  );
}
