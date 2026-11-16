// src/components/StepLiveCards.tsx
import React from 'react';
import {
  Play,
  Square,
  Printer,
  ArrowRight,
  Zap,
  Shuffle,
  ListOrdered,
  Radio,
} from 'lucide-react';
import { KartItem, SessionCard } from '../types/kart';
import { sortSessionEntries } from '../lib/raceLogic';

interface StepLiveCardsProps {
  darkMode: boolean;
  cards: SessionCard[];
  activeCardIndex: number;
  setActiveCardIndex: (idx: number) => void;
  activeKarts: KartItem[];
  onUpdateCard: (card: SessionCard) => void;
  onPrintCurrentCard: () => void;
  onGoToFinals: () => void;
  // KaRaS Bridge Props
  bridgeOnline: boolean;
  autoPoll: boolean;
  setAutoPoll: (v: boolean) => void;
  onTriggerStart: () => void;
  onTriggerStop: () => void;
  onSimulatePass: () => void;
}

export default function StepLiveCards({
  darkMode,
  cards,
  activeCardIndex,
  setActiveCardIndex,
  activeKarts,
  onUpdateCard,
  onPrintCurrentCard,
  onGoToFinals,
  bridgeOnline,
  autoPoll,
  setAutoPoll,
  onTriggerStart,
  onTriggerStop,
  onSimulatePass,
}: StepLiveCardsProps) {
  const currentCard = cards[activeCardIndex];

  const cardBg = darkMode
    ? 'bg-[#1A1A1A] border-[#272727] text-[#FAFAFA]'
    : 'bg-white border-[#D3D3D3] text-[#1A1A1A]';

  const subBg = darkMode
    ? 'bg-[#272727] border-[#404040] text-[#FAFAFA]'
    : 'bg-[#F5F5F5] border-[#D3D3D3] text-[#1A1A1A]';

  if (!currentCard) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${cardBg}`}>
        <p className="font-bold">Noch keine Rennkarten initialisiert.</p>
      </div>
    );
  }

  // Sortierte Einträge (Warm-up/Quali nach Bestzeit, Finale nach Runden)
  const displayedEntries = sortSessionEntries(currentCard);

  // Zeit manuell ändern
  const handleBestTimeChange = (driverId: number, val: string) => {
    const clean = val.replace(',', '.');
    const updated = currentCard.entries.map((e) =>
      e.driverId === driverId ? { ...e, bestTime: clean } : e
    );
    onUpdateCard({ ...currentCard, entries: updated });
  };

  // Kart manuell zuweisen (inkl. Tausch, falls Kart schon in der Gruppe vergeben ist)
  const handleManualKartChange = (driverId: number, newKartName: string) => {
    const targetDriver = currentCard.entries.find((e) => e.driverId === driverId);
    const otherDriverWithKart = currentCard.entries.find(
      (e) => e.kartName === newKartName && e.driverId !== driverId
    );

    const updated = currentCard.entries.map((e) => {
      if (e.driverId === driverId) {
        return { ...e, kartName: newKartName };
      }
      if (otherDriverWithKart && e.driverId === otherDriverWithKart.driverId && targetDriver) {
        return { ...e, kartName: targetDriver.kartName };
      }
      return e;
    });

    onUpdateCard({ ...currentCard, entries: updated });
  };

  // Karts in Zahlenfolge (1, 2, 3...) zuweisen
  const assignSequentialKarts = () => {
    const updated = currentCard.entries.map((e, idx) => ({
      ...e,
      kartName: activeKarts[idx % activeKarts.length]?.name || e.kartName,
    }));
    onUpdateCard({ ...currentCard, entries: updated });
  };

  // Karts zufällig auslosen
  const assignRandomKarts = () => {
    const pool = [...activeKarts].sort(() => Math.random() - 0.5);
    const updated = currentCard.entries.map((e, idx) => ({
      ...e,
      kartName: pool[idx % pool.length]?.name || e.kartName,
    }));
    onUpdateCard({ ...currentCard, entries: updated });
  };

  const handleNextCard = () => {
    if (activeCardIndex < cards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    } else {
      onGoToFinals();
    }
  };

  return (
    <div className="space-y-6">
      {/* Horizontale Karten-Timeline */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {cards.map((c, idx) => {
          const isCurrent = idx === activeCardIndex;
          const stateBadge =
            c.karasState === 'stopped'
              ? '🏁'
              : c.karasState === 'running'
              ? '🟢'
              : '⏳';
          return (
            <button
              key={c.id}
              onClick={() => setActiveCardIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition flex items-center space-x-1.5 ${
                isCurrent
                  ? 'bg-amber-500 text-black border-amber-500 shadow'
                  : subBg
              }`}
            >
              <span>{stateBadge}</span>
              <span>
                {idx + 1}. {c.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Aktive Live-Karte */}
      <div className={`p-6 rounded-2xl border shadow-md ${cardBg}`}>
        {/* Status-Banner oben */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#535353]/30">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  currentCard.karasState === 'waiting'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : currentCard.karasState === 'running'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                }`}
              >
                {currentCard.karasState === 'waiting' && '⏳ Wartet auf KaRaS Start...'}
                {currentCard.karasState === 'running' &&
                  '🟢 KaRaS läuft • Transponder-Zeiten live'}
                {currentCard.karasState === 'stopped' &&
                  '🏁 KaRaS Stopp erkannt • Lauf beendet'}
              </span>
              <span className="text-xs opacity-60">
                Karte {activeCardIndex + 1} von {cards.length}
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1">{currentCard.title}</h2>
            <p className="text-xs opacity-70">{currentCard.subtitle}</p>
          </div>

          {/* KaRaS Steuerung & Simulator */}
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
              KaRaS Auto-Bridge {autoPoll ? (bridgeOnline ? '(Online)' : '(Suche...)') : '(Aus)'}
            </button>

            {currentCard.karasState === 'waiting' && (
              <button
                type="button"
                onClick={onTriggerStart}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center shadow"
              >
                <Play className="w-4 h-4 mr-1 fill-black" />
                KaRaS Start erkannt
              </button>
            )}

            {currentCard.karasState === 'running' && (
              <>
                <button
                  type="button"
                  onClick={onSimulatePass}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center"
                >
                  <Zap className="w-4 h-4 mr-1" /> + Transponder-Impuls
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

        {/* Werkzeugleiste für Kart-Vergabe (Manuell, Zahlenfolge, Zufall) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold opacity-75">Kart-Zuweisung:</span>
            <button
              type="button"
              onClick={assignSequentialKarts}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
            >
              <ListOrdered className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Zahlenfolge (1, 2, 3...)
            </button>
            <button
              type="button"
              onClick={assignRandomKarts}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center ${subBg}`}
            >
              <Shuffle className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Per Zufall auslosen
            </button>
          </div>

          {currentCard.restingKarts.length > 0 && (
            <div className="text-xs px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold">
              Pausiert in Boxengasse: {currentCard.restingKarts.join(', ')}
            </div>
          )}
        </div>

        {/* Fahrer- & Zeiten-Tabelle (Live sortiert nach Bestzeit) */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs uppercase ${subBg}`}>
                <th className="p-3 w-16 text-center">Pos</th>
                <th className="p-3">Fahrer</th>
                <th className="p-3 w-44">Kart (Manuell wählbar)</th>
                <th className="p-3 text-center w-28">Runden</th>
                <th className="p-3 text-center w-36">Letzte Runde</th>
                <th className="p-3 text-right w-44">Schnellste Runde [s]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#535353]/25">
              {displayedEntries.map((entry, idx) => (
                <tr key={entry.driverId} className="hover:bg-amber-500/5 transition">
                  <td className="p-3 text-center font-black">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                        idx === 0 && entry.bestTime
                          ? 'bg-amber-500 text-black'
                          : subBg
                      }`}
                    >
                      P{idx + 1}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-base">{entry.driverName}</td>
                  <td className="p-3">
                    <select
                      value={entry.kartName}
                      onChange={(e) =>
                        handleManualKartChange(entry.driverId, e.target.value)
                      }
                      className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs w-full ${subBg}`}
                    >
                      {activeKarts.map((k) => {
                        const occupiedBy = currentCard.entries.find(
                          (other) =>
                            other.kartName === k.name &&
                            other.driverId !== entry.driverId
                        );
                        return (
                          <option key={k.id} value={k.name}>
                            {k.name}
                            {occupiedBy ? ` (⇄ ${occupiedBy.driverName})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">
                    {entry.laps}
                  </td>
                  <td className="p-3 text-center font-mono opacity-75">
                    {entry.lastTime ? `${entry.lastTime} s` : '–'}
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="text"
                      placeholder="00.000"
                      value={entry.bestTime}
                      onChange={(e) =>
                        handleBestTimeChange(entry.driverId, e.target.value)
                      }
                      className={`w-32 px-3 py-1.5 rounded-lg border text-right font-mono font-black text-sm focus:outline-none focus:border-amber-500 ${subBg}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fußzeile der Karte: Drucken & NEXT / WEITER */}
        <div className="mt-6 pt-4 border-t border-[#535353]/30 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onPrintCurrentCard}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm border flex items-center ${subBg}`}
          >
            <Printer className="w-4 h-4 mr-2 text-amber-500" />
            🖨️ Diesen Lauf jetzt drucken (A4)
          </button>

          <button
            type="button"
            onClick={handleNextCard}
            className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg flex items-center transition"
          >
            <span>
              {activeCardIndex < cards.length - 1
                ? 'NEXT / WEITER ZUM NÄCHSTEN LAUF'
                : 'QUALIFYING ABSCHLIESSEN & FINALE BERECHNEN'}
            </span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
