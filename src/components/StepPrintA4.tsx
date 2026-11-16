// src/components/StepPrintA4.tsx
import React, { useState } from 'react';
import { Printer, Award, FileText, Table, Flag } from 'lucide-react';
import {
  OverallDriverStanding,
  PrintViewMode,
  SessionCard,
} from '../types/kart';
import { sortSessionEntries } from '../lib/raceLogic';

interface StepPrintA4Props {
  darkMode: boolean;
  eventName: string;
  printMode: PrintViewMode;
  setPrintMode: (m: PrintViewMode) => void;
  currentCard: SessionCard | undefined;
  allCards: SessionCard[];
  standings: OverallDriverStanding[];
  finalCards: SessionCard[];
  qualiTurns: number;
}

export default function StepPrintA4({
  darkMode,
  eventName,
  printMode,
  setPrintMode,
  currentCard,
  allCards,
  standings,
  finalCards,
  qualiTurns,
}: StepPrintA4Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<number>(
    standings[0]?.driverId || 1
  );

  const selectedStanding =
    standings.find((s) => s.driverId === selectedDriverId) || standings[0];

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#E6E6E6] border-[#D3D3D3] text-[#1A1A1A]';

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
            { id: 'current_card', label: 'Aktueller Lauf', icon: FileText },
            { id: 'quali_total', label: 'Quali-Gesamtwertung', icon: Table },
            { id: 'rolling_plan', label: 'KartRolling-Plan', icon: Table },
            { id: 'final_results', label: 'Final-Ergebnisse', icon: Flag },
            { id: 'certificate', label: 'Sieger-Urkunde (A4)', icon: Award },
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

        <div className="flex items-center space-x-3">
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
      <div className="bg-white text-black p-10 rounded-2xl shadow-xl max-w-[210mm] mx-auto print:shadow-none print:p-0 print:max-w-none">
        {/* Motorsport Header */}
        <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-neutral-500">
              KARTBAHN RHEINFELDEN • HR-RACEMASTER TIMING
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight mt-0.5">
              {eventName}
            </h1>
          </div>
          <div className="text-right text-xs font-mono text-neutral-600">
            <div>Datum: {new Date().toLocaleDateString('de-DE')}</div>
            <div>System: HR-RaceMaster Live</div>
          </div>
        </div>

        {/* 1. AKTUELLER LAUF */}
        {printMode === 'current_card' && currentCard && (
          <div>
            <h2 className="text-xl font-black uppercase mb-1">
              {currentCard.title}
            </h2>
            <p className="text-xs text-neutral-600 mb-4">{currentCard.subtitle}</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-xs uppercase">
                  <th className="py-2 text-left">Pos</th>
                  <th className="py-2 text-left">Fahrer</th>
                  <th className="py-2 text-left">Kart</th>
                  <th className="py-2 text-center">Runden</th>
                  <th className="py-2 text-right">Schnellste Runde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {sortSessionEntries(currentCard).map((e, idx) => (
                  <tr key={e.driverId}>
                    <td className="py-2 font-black">P{idx + 1}</td>
                    <td className="py-2 font-bold">{e.driverName}</td>
                    <td className="py-2 font-mono">{e.kartName}</td>
                    <td className="py-2 text-center font-mono">{e.laps}</td>
                    <td className="py-2 text-right font-mono font-black">
                      {e.bestTime ? `${e.bestTime} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. QUALIFYING GESAMTWERTUNG */}
        {printMode === 'quali_total' && (
          <div>
            <h2 className="text-xl font-black uppercase mb-4">
              Offizieller Wertungsaushang – Qualifying Gesamtwertung
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black uppercase">
                  <th className="py-2 text-left">Rang</th>
                  <th className="py-2 text-left">Fahrer</th>
                  <th className="py-2 text-left">Gruppe</th>
                  {Array.from({ length: qualiTurns }, (_, i) => (
                    <th key={i} className="py-2 text-right">
                      Lauf {i + 1}
                    </th>
                  ))}
                  <th className="py-2 text-right">Beste Runde</th>
                  <th className="py-2 text-right">Gesamtzeit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {standings.map((st) => (
                  <tr key={st.driverId}>
                    <td className="py-2 font-black">#{st.rank}</td>
                    <td className="py-2 font-bold">{st.driverName}</td>
                    <td className="py-2">{st.groupName}</td>
                    {st.turnTimes.map((t, idx) => (
                      <td key={idx} className="py-2 text-right font-mono">
                        {t ? `${t.toFixed(3)}s` : '–'}
                      </td>
                    ))}
                    <td className="py-2 text-right font-mono">
                      {st.bestLap ? `${st.bestLap.toFixed(3)} s` : '–'}
                    </td>
                    <td className="py-2 text-right font-mono font-black">
                      {st.totalTime ? `${st.totalTime.toFixed(3)} s` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. KARTROLLING PLAN */}
        {printMode === 'rolling_plan' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase">
              Kart- & Rotationsplan (Boxengassen-Aushang)
            </h2>
            {allCards
              .filter((c) => c.kind === 'quali')
              .map((c) => (
                <div
                  key={c.id}
                  className="border border-neutral-400 rounded-lg p-3 break-inside-avoid"
                >
                  <div className="font-black text-sm mb-2 flex justify-between">
                    <span>{c.title}</span>
                    {c.restingKarts.length > 0 && (
                      <span className="text-xs font-mono">
                        Pause in Box: {c.restingKarts.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {c.entries.map((e) => (
                      <div
                        key={e.driverId}
                        className="border border-neutral-300 p-1.5 rounded flex justify-between"
                      >
                        <span className="font-bold">{e.driverName}</span>
                        <span className="font-mono font-black">{e.kartName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* 4. FINAL-ERGEBNISSE */}
        {printMode === 'final_results' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase">
              Offizielles Endergebnis – Finalläufe (Wertung nach Rundenanzahl)
            </h2>
            {finalCards.map((fc) => (
              <div key={fc.id} className="break-inside-avoid">
                <h3 className="text-base font-black uppercase bg-black text-white px-3 py-1.5 mb-2">
                  {fc.title}
                </h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black uppercase">
                      <th className="py-1.5 text-left">Platz</th>
                      <th className="py-1.5 text-left">Startplatz</th>
                      <th className="py-1.5 text-left">Fahrer</th>
                      <th className="py-1.5 text-left">Kart</th>
                      <th className="py-1.5 text-center">Runden</th>
                      <th className="py-1.5 text-right">Beste Runde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-300">
                    {sortSessionEntries(fc).map((e, idx) => (
                      <tr key={e.driverId}>
                        <td className="py-1.5 font-black">#{idx + 1}</td>
                        <td className="py-1.5 font-mono">Pole P{e.gridPos}</td>
                        <td className="py-1.5 font-bold">{e.driverName}</td>
                        <td className="py-1.5 font-mono">{e.kartName}</td>
                        <td className="py-1.5 text-center font-mono font-black">
                          {e.laps} Runden
                        </td>
                        <td className="py-1.5 text-right font-mono">
                          {e.bestTime ? `${e.bestTime} s` : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* 5. MOTORSPORT SIEGER-URKUNDE (A4) */}
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

        <div className="mt-10 pt-3 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-500">
          <span>HR-RaceMaster • Offizieller Zeitnahme-Beleg</span>
          <span>© Copyright Hans Richter</span>
        </div>
      </div>
    </div>
  );
}
