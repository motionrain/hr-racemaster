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
  customLogo?: string;
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

/**
 * Formatiert "Kart 1" -> "NR.1", "Kart 12" -> "NR.12", "Kids 1" -> "NR.K1"
 * Ohne Umrandungskästchen und ohne das Wort "KART".
 */
function formatKartNrShort(kartName: string | undefined): string {
  if (!kartName || kartName === '–') return '–';
  const clean = kartName.trim();
  const mAdult = clean.match(/^Kart\s*0*(\d+)/i);
  if (mAdult) return `NR.${mAdult[1]}`;
  const mKids = clean.match(/^Kids\s*0*(\d+)/i);
  if (mKids) return `NR.K${mKids[1]}`;
  const mNum = clean.match(/^0*(\d+)$/);
  if (mNum) return `NR.${mNum[1]}`;
  return clean.replace(/^KART\s*/i, 'NR.').toUpperCase();
}

export default function StepPrintA4({
  darkMode,
  eventName,
  customLogo,
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

  // Prüfen ob für den Urkunden-Fahrer auch Finaldaten vorliegen
  const selectedFinalEntry = combinedFinals.find(
    (f) => f.driverId === selectedStanding?.driverId
  );

  return (
    <div className="space-y-6">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          html, body, main {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

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
            { id: 'quali_total', label: '1. Quali-Gesamtwertung', icon: Table },
            { id: 'rolling_plan', label: '2. Rotationsplan (Boxengasse)', icon: Grid },
            { id: 'current_card', label: '3. Aktueller Lauf', icon: FileText },
            { id: 'final_group', label: '4. Finale Einzelgruppe', icon: Flag },
            { id: 'final_overall', label: '5. Finale Gesamtwertung', icon: Trophy },
            { id: 'certificate', label: '6. Sieger-Urkunde (Vollbild A4)', icon: Award },
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
              <span>Nur aktive Transponder drucken</span>
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

      {/* =====================================================================
          DIN-A4 DRUCKBLATT (EXAKT A4-KONFORM: 210mm BREITE)
         ===================================================================== */}
      <div className="bg-white text-black p-5 sm:p-7 rounded-2xl shadow-xl w-full max-w-[210mm] mx-auto print:shadow-none print:rounded-none print:p-1 print:m-0 print:max-w-none print:w-full">
        {/* Standard-Listen-Header (wird bei der Vollbild-Urkunde ausgeblendet, da die Urkunde ihr eigenes A4-Design hat) */}
        {printMode !== 'certificate' && (
          <div className="border-b-4 border-black pb-3 mb-4 flex justify-between items-center gap-4">
            <div className="flex items-center space-x-4 min-w-0">
              {customLogo && (
                <img
                  src={customLogo}
                  alt="Logo"
                  className="h-12 sm:h-14 w-auto max-w-[160px] object-contain shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                  KARTBAHN RHEINFELDEN • HR-RACEMASTER TIMING
                </div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-0.5 truncate">
                  {eventName}
                </h1>
              </div>
            </div>
            <div className="text-right text-[11px] font-mono font-bold text-neutral-700 shrink-0">
              <div>Datum: {new Date().toLocaleDateString('de-DE')}</div>
              <div>System: HR-RaceMaster Live</div>
            </div>
          </div>
        )}

        {/* =====================================================================
            1. QUALIFYING GESAMTWERTUNG (KART NR. ÜBER LAUF 1/2, IN ZELLE NUR NR.1 / NR.2 OHNE KÄSTCHEN)
           ===================================================================== */}
        {printMode === 'quali_total' && (
          <div className="space-y-5">
            {(qualiMatrixMode === 'group_matrix' || qualiMatrixMode === 'both') && (
              <div className="space-y-4">
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
                      <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                        <span>{group.name} – Wertung ({groupStandings.length} Fahrer)</span>
                        <span>Sortiert nach Gesamtzeit</span>
                      </div>

                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black">
                            <th className="py-1.5 px-1.5 text-center w-10 border-r border-black">
                              Pos
                            </th>
                            <th className="py-1.5 px-2.5 text-left border-r border-black min-w-[135px]">
                              Fahrername
                            </th>
                            {Array.from({ length: qualiTurns }, (_, t) => (
                              <th
                                key={t}
                                className="py-1 px-1 text-center border-r border-black leading-tight"
                              >
                                <div className="text-[9px] font-bold text-neutral-700">
                                  Kart NR.
                                </div>
                                <div className="text-[11px] font-black text-black">
                                  Lauf {t + 1}
                                </div>
                              </th>
                            ))}
                            <th className="py-1.5 px-2 text-right border-r border-black w-20 whitespace-nowrap">
                              Beste Rd.
                            </th>
                            <th className="py-1.5 px-2 text-right border-r border-black w-24 bg-neutral-300 whitespace-nowrap">
                              Gesamtzeit
                            </th>
                            <th className="py-1.5 px-2 text-center w-28 whitespace-nowrap">
                              Finale
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {groupStandings.map((st, idx) => (
                            <tr key={st.driverId}>
                              <td className="py-1.5 px-1.5 text-center font-black text-xs border-r border-black bg-neutral-100">
                                P{idx + 1}
                              </td>
                              <td className="py-1.5 px-2.5 font-extrabold text-[13px] border-r border-black whitespace-nowrap">
                                {st.driverName}
                              </td>
                              {st.turnTimes.map((tVal, tIdx) => (
                                <td
                                  key={tIdx}
                                  className="py-1 px-1 text-center font-mono border-r border-black"
                                >
                                  <div className="font-black text-xs text-black leading-tight">
                                    {formatKartNrShort(st.turnKarts[tIdx])}
                                  </div>
                                  <div className="font-bold text-[11px] text-neutral-800 leading-tight mt-0.5">
                                    {tVal ? `${tVal.toFixed(3)}s` : '–'}
                                  </div>
                                </td>
                              ))}
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-xs border-r border-black">
                                {st.bestLap ? `${st.bestLap.toFixed(3)}s` : '–'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-black text-xs border-r border-black bg-neutral-100">
                                {st.totalTime ? `${st.totalTime.toFixed(3)}s` : '–'}
                              </td>
                              <td className="py-1.5 px-2 text-center font-black text-[11px] whitespace-nowrap">
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
                <div className="bg-black text-white px-3 py-1.5 flex justify-between items-center text-xs font-black uppercase">
                  <span>Gesamtrangliste Qualifying (Platz #1 bis #{filteredStandings.length})</span>
                  <span>Basis für Finaleinteilung</span>
                </div>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black">
                      <th className="py-1.5 px-1.5 text-center w-11 border-r border-black">
                        Rang
                      </th>
                      <th className="py-1.5 px-2.5 text-left border-r border-black min-w-[135px]">
                        Fahrername
                      </th>
                      <th className="py-1.5 px-1.5 text-center w-14 border-r border-black">
                        Gruppe
                      </th>
                      {Array.from({ length: qualiTurns }, (_, t) => (
                        <th
                          key={t}
                          className="py-1 px-1 text-center border-r border-black leading-tight"
                        >
                          <div className="text-[9px] font-bold text-neutral-700">
                            Kart NR.
                          </div>
                          <div className="text-[11px] font-black text-black">
                            Lauf {t + 1}
                          </div>
                        </th>
                      ))}
                      <th className="py-1.5 px-2 text-right border-r border-black w-20 whitespace-nowrap">
                        Beste Rd.
                      </th>
                      <th className="py-1.5 px-2 text-right border-r border-black w-24 bg-neutral-300 whitespace-nowrap">
                        Gesamtzeit
                      </th>
                      <th className="py-1.5 px-2 text-center w-28 whitespace-nowrap">
                        Qualifiziert für
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredStandings.map((st, idx) => (
                      <tr key={st.driverId}>
                        <td className="py-1.5 px-1.5 text-center font-mono font-black text-xs border-r border-black bg-neutral-100">
                          #{idx + 1}
                        </td>
                        <td className="py-1.5 px-2.5 font-extrabold text-[13px] border-r border-black whitespace-nowrap">
                          {st.driverName}
                        </td>
                        <td className="py-1.5 px-1.5 text-center font-bold text-xs border-r border-black">
                          {st.groupName.replace('Gruppe ', 'Gr. ')}
                        </td>
                        {st.turnTimes.map((tVal, tIdx) => (
                          <td
                            key={tIdx}
                            className="py-1 px-1 text-center font-mono border-r border-black"
                          >
                            <div className="font-black text-xs text-black leading-tight">
                              {formatKartNrShort(st.turnKarts[tIdx])}
                            </div>
                            <div className="font-bold text-[11px] text-neutral-800 leading-tight mt-0.5">
                              {tVal ? `${tVal.toFixed(3)}s` : '–'}
                            </div>
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-xs border-r border-black">
                          {st.bestLap ? `${st.bestLap.toFixed(3)}s` : '–'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-black text-xs border-r border-black bg-neutral-100">
                          {st.totalTime ? `${st.totalTime.toFixed(3)}s` : '–'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-black text-[11px] whitespace-nowrap">
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

        {/* =====================================================================
            2. VORAB-ROTATIONSPLAN (BOXENGASSEN-AUSHANG MIT "KART NR. / LAUF X" & "NR.1")
           ===================================================================== */}
        {printMode === 'rolling_plan' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black uppercase">
                Gruppen- & Kart-Einteilung (Boxengassen-Aushang)
              </h2>
              <p className="text-xs font-bold text-neutral-700">
                Bitte vor jedem Lauf die zugeteilte Kart-Nummer (NR.1, NR.2...) in der Tabelle ablesen!
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
                  <div className="bg-black text-white px-3.5 py-2 flex justify-between items-center text-sm font-black uppercase">
                    <span>
                      {group.name} ({group.drivers.length} Fahrer)
                    </span>
                    <span>Kart-Zuteilung für Lauf 1 bis {qualiTurns}</span>
                  </div>

                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black">
                        <th className="py-2 px-2 text-center w-12 border-r border-black">
                          Nr.
                        </th>
                        <th className="py-2 px-3 text-left border-r border-black min-w-[140px]">
                          Fahrername
                        </th>
                        {Array.from({ length: qualiTurns }, (_, t) => (
                          <th
                            key={t}
                            className="py-1.5 px-1.5 text-center border-r border-black last:border-r-0 leading-tight"
                          >
                            <div className="text-[9px] font-bold text-neutral-700">
                              Kart NR.
                            </div>
                            <div className="text-xs font-black text-black">
                              Lauf {t + 1}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {group.drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td className="py-2 px-2 text-center font-mono font-black text-xs border-r border-black bg-neutral-100">
                            #{driver.id}
                          </td>
                          <td className="py-2 px-3 font-extrabold text-[13px] border-r border-black whitespace-nowrap">
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
                                className="py-2 px-1.5 text-center font-mono font-black text-sm text-black border-r border-black last:border-r-0"
                              >
                                {formatKartNrShort(entry?.kartName)}
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

        {/* =====================================================================
            3. AKTUELLER EINZELLAUF (KOMPAKT A4, KART NR. ALS NR.1 OHNE KÄSTCHEN)
           ===================================================================== */}
        {printMode === 'current_card' && currentCard && (
          <div className="border-2 border-black rounded-lg overflow-hidden">
            <div className="bg-black text-white px-4 py-2.5 flex justify-between items-center">
              <span className="font-black uppercase text-base">{currentCard.title}</span>
              <span className="text-xs font-mono font-bold">Offizielles Laufergebnis</span>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                  <th className="py-2 px-2.5 text-center w-16 border-r border-black">Platz</th>
                  <th className="py-2 px-3.5 text-left border-r border-black">Fahrername</th>
                  <th className="py-2 px-2.5 text-center w-28 border-r border-black">Kart NR.</th>
                  <th className="py-2 px-2.5 text-center w-24 border-r border-black">Runden</th>
                  <th className="py-2 px-3.5 text-right w-36">Schnellste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {sortSessionEntries(currentCard, hideEmptyKartsOnPrint).map((e, idx) => (
                  <tr key={e.driverId}>
                    <td className="py-2 px-2.5 text-center font-black text-sm border-r border-black bg-neutral-100">
                      P{idx + 1}
                    </td>
                    <td className="py-2 px-3.5 font-extrabold text-sm border-r border-black">
                      {e.driverName}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black">
                      {formatKartNrShort(e.kartName)}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black">
                      {e.laps}
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono font-black text-sm">
                      {e.bestTime ? `${Number(e.bestTime).toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =====================================================================
            4. EINZELWERTUNG FINALE GRUPPE
           ===================================================================== */}
        {printMode === 'final_group' && singleFinalCard && (
          <div className="border-2 border-black rounded-lg overflow-hidden">
            <div className="bg-black text-white px-4 py-2.5 flex justify-between items-center text-sm font-black uppercase">
              <span>{singleFinalCard.title}</span>
              <span>Wertung nach Rundenanzahl</span>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                  <th className="py-2 px-2.5 text-center w-16 border-r border-black">Platz</th>
                  <th className="py-2 px-2.5 text-center w-24 border-r border-black">Grid</th>
                  <th className="py-2 px-3.5 text-left border-r border-black">Fahrername</th>
                  <th className="py-2 px-2.5 text-center w-28 border-r border-black">Kart NR.</th>
                  <th className="py-2 px-2.5 text-center w-28 border-r border-black bg-neutral-300">
                    Runden
                  </th>
                  <th className="py-2 px-3.5 text-right w-36">Beste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {sortSessionEntries(singleFinalCard, hideEmptyKartsOnPrint).map((e, idx) => (
                  <tr key={e.driverId}>
                    <td className="py-2 px-2.5 text-center font-black text-sm border-r border-black bg-neutral-100">
                      P{idx + 1}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-bold text-xs border-r border-black">
                      Pole P{e.gridPos}
                    </td>
                    <td className="py-2 px-3.5 font-extrabold text-sm border-r border-black">
                      {e.driverName}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black">
                      {formatKartNrShort(e.kartName)}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black bg-neutral-100">
                      {e.laps} Rd.
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono font-black text-sm">
                      {e.bestTime ? `${Number(e.bestTime).toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =====================================================================
            5. GESAMTWERTUNG FINALE
           ===================================================================== */}
        {printMode === 'final_overall' && (
          <div className="space-y-5">
            <div className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid">
              <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-sm font-black uppercase">
                <span>Offizielles Endergebnis Finale (Platz #1 bis #{combinedFinals.length})</span>
                <span>Alle Finalgruppen kombiniert</span>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-200 border-b-2 border-black uppercase font-black text-xs">
                    <th className="py-2 px-2.5 text-center w-16 border-r border-black">Rang</th>
                    <th className="py-2 px-3.5 text-left border-r border-black">Fahrername</th>
                    <th className="py-2 px-2.5 text-center w-36 border-r border-black">Final-Gruppe</th>
                    <th className="py-2 px-2.5 text-center w-24 border-r border-black">Kart NR.</th>
                    <th className="py-2 px-2.5 text-center w-24 border-r border-black bg-neutral-300">
                      Runden
                    </th>
                    <th className="py-2 px-3.5 text-right w-32">Beste Runde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {combinedFinals.map((row) => (
                    <tr key={row.driverId}>
                      <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black bg-neutral-100">
                        #{row.overallRank}
                      </td>
                      <td className="py-2 px-3.5 font-extrabold text-sm border-r border-black">
                        {row.driverName}
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold text-xs border-r border-black">
                        {row.finalGroupName.replace('Finale ', '')} (P{row.groupRank})
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black">
                        {formatKartNrShort(row.kartName)}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono font-black text-sm border-r border-black bg-neutral-100">
                        {row.laps} Rd.
                      </td>
                      <td className="py-2 px-3.5 text-right font-mono font-black text-sm">
                        {row.bestTime ? `${Number(row.bestTime).toFixed(3)} s` : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            6. VOLLBILD DIN-A4 MOTORSPORT SIEGER-URKUNDE (GEHT ÜBER DAS GANZE A4-BLATT)
           ===================================================================== */}
        {printMode === 'certificate' && selectedStanding && (
          <div className="w-full min-h-[276mm] border-[6px] border-black rounded-xl overflow-hidden flex flex-col justify-between bg-white text-black relative">
            {/* OBEN: Sportlicher Zielflaggen-Streifen & Motorsport-Akzentbalken */}
            <div>
              <div
                className="h-6 w-full border-b-2 border-black"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="h-2.5 w-full bg-amber-500 border-b-2 border-black" />

              {/* Urkunden-Kopf mit eigenem Logo (falls hochgeladen) & Motorsport-Badge */}
              <div className="px-10 pt-8 pb-4 flex flex-col items-center text-center">
                {customLogo ? (
                  <img
                    src={customLogo}
                    alt="Event Logo"
                    className="h-20 sm:h-24 w-auto max-w-[280px] object-contain mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-black text-amber-400 flex items-center justify-center shadow-md mb-3 border-2 border-amber-500">
                    <Trophy className="w-9 h-9" />
                  </div>
                )}

                <div className="text-xs font-black uppercase tracking-[0.35em] text-neutral-600">
                  KARTBAHN RHEINFELDEN • OFFICIAL MOTORSPORT RACING CERTIFICATE
                </div>

                {/* Sportlicher Haupttitel mit Racing-Schrägstreifen */}
                <div className="mt-4 inline-flex items-center space-x-3">
                  <div className="hidden sm:flex space-x-1">
                    <span className="w-3 h-9 bg-black -skew-x-12 inline-block" />
                    <span className="w-2 h-9 bg-amber-500 -skew-x-12 inline-block" />
                  </div>
                  <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight italic">
                    SIEGER-URKUNDE
                  </h1>
                  <div className="hidden sm:flex space-x-1">
                    <span className="w-2 h-9 bg-amber-500 -skew-x-12 inline-block" />
                    <span className="w-3 h-9 bg-black -skew-x-12 inline-block" />
                  </div>
                </div>

                <div className="mt-3 px-6 py-1.5 rounded-full bg-black text-white text-xs sm:text-sm font-black uppercase tracking-widest">
                  {eventName}
                </div>
              </div>
            </div>

            {/* MITTE: Fahrername & großes Motorsport-Podiums-Emblem mit Lorbeerkranz */}
            <div className="px-10 my-auto text-center space-y-6">
              <p className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-600">
                Verliehen für herausragende fahrerische Leistung auf der Rennstrecke an
              </p>

              <div className="py-3 px-6 border-b-4 border-black inline-block min-w-[70%]">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-black">
                  {selectedStanding.driverName}
                </div>
              </div>

              {/* Großes Sport-Platzierungs-Badge mit Siegerkranz-Optik */}
              <div className="py-4 flex justify-center">
                <div className="relative inline-flex items-center justify-center px-12 py-5 rounded-2xl bg-black text-white border-4 border-amber-500 shadow-xl">
                  <div className="text-center">
                    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400 mb-1">
                      OFFIZIELLE GESAMTWERTUNG
                    </div>
                    <div className="text-4xl sm:text-5xl font-black uppercase tracking-wider italic text-white">
                      {selectedFinalEntry
                        ? `${selectedFinalEntry.overallRank}. PLATZ`
                        : `${selectedStanding.rank}. PLATZ`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sportliche Telemetrie-Karten (3 Spalten) */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
                <div className="border-2 border-black rounded-xl p-3.5 bg-neutral-50 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    GRUPPE / STARTPLATZ
                  </div>
                  <div className="text-lg font-mono font-black mt-1">
                    {selectedStanding.groupName} • P{selectedStanding.groupRank}
                  </div>
                </div>

                <div className="border-2 border-black rounded-xl p-3.5 bg-neutral-50 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    SCHNELLSTE EINZELRUNDE
                  </div>
                  <div className="text-lg font-mono font-black mt-1">
                    {selectedStanding.bestLap
                      ? `${selectedStanding.bestLap.toFixed(3)} Sek.`
                      : selectedFinalEntry?.bestTime
                      ? `${Number(selectedFinalEntry.bestTime).toFixed(3)} Sek.`
                      : 'Gewertet'}
                  </div>
                </div>

                <div className="border-2 border-black rounded-xl p-3.5 bg-neutral-50 text-center">
                  <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    {selectedFinalEntry && selectedFinalEntry.laps > 0
                      ? 'FINALE RUNDEN'
                      : selectedStanding.completedTurns > 0
                      ? `GESAMTZEIT (${selectedStanding.completedTurns} LÄUFE)`
                      : 'WERTUNGSMODUS'}
                  </div>
                  <div className="text-lg font-mono font-black mt-1">
                    {selectedFinalEntry && selectedFinalEntry.laps > 0
                      ? `${selectedFinalEntry.laps} Runden`
                      : selectedStanding.totalTime
                      ? `${selectedStanding.totalTime.toFixed(3)} Sek.`
                      : 'Grand Prix'}
                  </div>
                </div>
              </div>
            </div>

            {/* UNTEN: Datum, Offizielles Timing-Siegel, Unterschrift & Zielflaggen-Abschluss */}
            <div>
              <div className="px-12 pb-8 pt-6 grid grid-cols-3 items-end gap-6 text-xs">
                <div className="text-left border-t-2 border-black pt-2">
                  <div className="font-black uppercase">DATUM & AUSTRAGUNGSORT</div>
                  <div className="font-mono text-neutral-700 mt-0.5">
                    {new Date().toLocaleDateString('de-DE')} • Rheinfelden
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-flex flex-col items-center justify-center px-4 py-2 rounded-full border-2 border-black bg-neutral-100">
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      CERTIFIED TIMING
                    </span>
                    <span className="text-[11px] font-mono font-black">
                      HR-RACEMASTER
                    </span>
                  </div>
                </div>

                <div className="text-right border-t-2 border-black pt-2">
                  <div className="font-black uppercase">RENNLEITUNG</div>
                  <div className="text-neutral-700 mt-0.5">
                    Kartbahn Rheinfelden
                  </div>
                </div>
              </div>

              <div className="h-2.5 w-full bg-amber-500 border-t-2 border-black" />
              <div
                className="h-6 w-full border-t-2 border-black"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
                  backgroundSize: '24px 24px',
                }}
              />
            </div>
          </div>
        )}

        {printMode !== 'certificate' && (
          <div className="mt-5 pt-2.5 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-500">
            <span>HR-RaceMaster • Offizieller Zeitnahme-Beleg</span>
            <span>© Copyright Hans Richter</span>
          </div>
        )}
      </div>
    </div>
  );
}
