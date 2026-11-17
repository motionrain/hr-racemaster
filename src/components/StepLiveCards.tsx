// src/components/StepLiveCards.tsx
import React, { useState } from 'react';
import {
  Play,
  Square,
  Printer,
  ArrowRight,
  Zap,
  Shuffle,
  ListOrdered,
  Radio,
  Wrench,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { KartItem, SessionCard } from '../types/kart';
import { sortSessionEntries, isEntryActive } from '../lib/raceLogic';

interface StepLiveCardsProps {
  darkMode: boolean;
  cards: SessionCard[];
  activeCardIndex: number;
  setActiveCardIndex: (idx: number) => void;
  activeKarts: KartItem[];
  onUpdateCard: (card: SessionCard) => void;
  onAssignGroupKarts: (groupName: string, karts: string[]) => void;
  onPrintCurrentCard: () => void;
  onGoToFinals: () => void;
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
  onAssignGroupKarts,
  onPrintCurrentCard,
  onGoToFinals,
  bridgeOnline,
  autoPoll,
  setAutoPoll,
  onTriggerStart,
  onTriggerStop,
  onSimulatePass,
}: StepLiveCardsProps) {
  // Standardmäßig TRUE: Fahrer & Karts tauchen erst in der Liste auf, wenn ihr Transponder erfasst wird!
  const [onlyActiveTransponders, setOnlyActiveTransponders] = useState<boolean>(true);
  const [showManualKartDistributor, setShowManualKartDistributor] = useState<boolean>(false);

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

  const activeEntriesCount = currentCard.entries.filter(isEntryActive).length;
  const displayedEntries = sortSessionEntries(currentCard, onlyActiveTransponders);

  const handleBestTimeChange = (driverId: number, val: string) => {
    const clean = val.replace(',', '.');
    const num = parseFloat(clean);
    const updated = currentCard.entries.map((e) =>
      e.driverId === driverId
        ? {
            ...e,
            bestTime: clean,
            transponderActive: (!isNaN(num) && num > 0) || e.transponderActive,
          }
        : e
    );
    onUpdateCard({ ...currentCard, entries: updated });
  };

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
    onAssignGroupKarts(
      currentCard.groupName,
      updated.map((e) => e.kartName)
    );
  };

  const toggleDriverActive = (driverId: number) => {
    const updated = currentCard.entries.map((e) =>
      e.driverId === driverId ? { ...e, transponderActive: !e.transponderActive } : e
    );
    onUpdateCard({ ...currentCard, entries: updated });
  };

  const assignSequentialKarts = () => {
    const updated = currentCard.entries.map((e, idx) => ({
      ...e,
      kartName: activeKarts[idx % activeKarts.length]?.name || e.kartName,
    }));
    onUpdateCard({ ...currentCard, entries: updated });
    onAssignGroupKarts(
      currentCard.groupName,
      updated.map((e) => e.kartName)
    );
  };

  const assignRandomKarts = () => {
    const pool = [...activeKarts].sort(() => Math.random() - 0.5);
    const updated = currentCard.entries.map((e, idx) => ({
      ...e,
      kartName: pool[idx % pool.length]?.name || e.kartName,
    }));
    onUpdateCard({ ...currentCard, entries: updated });
    onAssignGroupKarts(
      currentCard.groupName,
      updated.map((e) => e.kartName)
    );
  };

  const currentGroupKarts = currentCard.entries.map((e) => e.kartName);
  const handleQuickPickGroupKart = (kartName: string) => {
    if (currentGroupKarts.includes(kartName)) return;
    const nextKarts = [...currentGroupKarts];
    const inactiveIdx = currentCard.entries.findIndex((e) => !isEntryActive(e));
    const replaceIdx = inactiveIdx >= 0 ? inactiveIdx : nextKarts.length - 1;
    if (replaceIdx >= 0) {
      nextKarts[replaceIdx] = kartName;
      const updated = currentCard.entries.map((e, i) => ({
        ...e,
        kartName: nextKarts[i] || e.kartName,
      }));
      onUpdateCard({ ...currentCard, entries: updated });
      onAssignGroupKarts(currentCard.groupName, nextKarts);
    }
  };

  const handleNextCard = () => {
    if (activeCardIndex < cards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    } else {
      onGoToFinals();
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Horizontale Lauf-Timeline */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {cards.map((c, idx) => {
          const isCurrent = idx === activeCardIndex;
          const activeCnt = c.entries.filter(isEntryActive).length;
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
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border transition flex items-center space-x-2 ${
                isCurrent
                  ? 'bg-amber-500 text-black border-amber-500 shadow-lg scale-[1.02]'
                  : subBg
              }`}
            >
              <span>{stateBadge}</span>
              <span>
                {idx + 1}. {c.title}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isCurrent ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {activeCnt}/{c.entries.length} aktiv
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Aktive Live-Karte */}
      <div className={`p-6 rounded-2xl border shadow-md ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#535353]/30">
          <div>
            <div className="flex flex-wrap items-center gap-2">
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
                  '🟢 KaRaS läuft • Erfasse aktive Transponder'}
                {currentCard.karasState === 'stopped' &&
                  '🏁 KaRaS Stopp erkannt • Lauf beendet'}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                📡 {activeEntriesCount} von {currentCard.entries.length} Transpondern aktiv
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1.5">{currentCard.title}</h2>
            <p className="text-xs opacity-70">{currentCard.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoPoll(!autoPoll)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center ${
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
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center shadow"
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
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center"
                >
                  <Zap className="w-4 h-4 mr-1" /> + Transponder-Impuls
                </button>
                <button
                  type="button"
                  onClick={onTriggerStop}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center shadow"
                >
                  <Square className="w-4 h-4 mr-1 fill-white" />
                  KaRaS Stopp erkannt
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. Steuerleiste: Filter (Nur aktive Transponder) + Manuelle Kart-Verteilung */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyActiveTransponders(!onlyActiveTransponders)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center transition ${
                onlyActiveTransponders
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : subBg
              }`}
            >
              {onlyActiveTransponders ? (
                <>
                  <Eye className="w-4 h-4 mr-1.5 text-emerald-400" />
                  Live-Ansicht: Nur erfasste Transponder ({activeEntriesCount})
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-1.5 text-amber-400" />
                  Alle geplanten Fahrer sichtbar ({currentCard.entries.length})
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowManualKartDistributor(!showManualKartDistributor)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center transition ${
                showManualKartDistributor
                  ? 'bg-amber-500 text-black border-amber-500'
                  : subBg
              }`}
            >
              <Wrench className="w-4 h-4 mr-1.5 text-amber-500" />
              🎯 Karts manuell an {currentCard.groupName} verteilen ({currentCard.entries.length} Fahrer)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {/* 4. Aufklappbares Panel: Manuelle Kart-Verteilung an die Gruppe */}
        {showManualKartDistributor && (
          <div className={`mb-5 p-4 rounded-xl border-2 border-amber-500/50 ${subBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-black text-amber-400 uppercase">
                  🎯 Manuelle Kart-Verteilung für {currentCard.groupName}
                </h3>
                <p className="text-xs opacity-80">
                  Wähle für jeden Fahrer das Kart aus (wird für die Rotation dieser Gruppe übernommen):
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeKarts.map((k) => {
                  const inUse = currentGroupKarts.includes(k.name);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => handleQuickPickGroupKart(k.name)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold border transition ${
                        inUse
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'opacity-60 hover:opacity-100 border-[#535353]'
                      }`}
                    >
                      {k.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {currentCard.entries.map((entry, idx) => {
                const active = isEntryActive(entry);
                return (
                  <div
                    key={entry.driverId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      active
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[#535353]/40 bg-black/20'
                    }`}
                  >
                    <div className="truncate">
                      <span className="text-xs font-mono opacity-60 mr-1.5">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-sm">{entry.driverName}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <select
                        value={entry.kartName}
                        onChange={(e) =>
                          handleManualKartChange(entry.driverId, e.target.value)
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-[#1A1A1A] text-amber-400 font-mono font-black text-xs"
                      >
                        {activeKarts.map((k) => {
                          const occ = currentCard.entries.find(
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

                      <button
                        type="button"
                        onClick={() => toggleDriverActive(entry.driverId)}
                        className={`p-1.5 rounded-lg border text-xs font-bold ${
                          active
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'border-[#535353] opacity-60 hover:opacity-100'
                        }`}
                        title="Manuell ein-/ausblenden"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Haupt-Wertungstabelle: Zeigt ERST DANN Fahrer & Karts, sobald ein Transponder erfasst wird! */}
        {displayedEntries.length === 0 ? (
          <div className={`p-10 rounded-2xl border-2 border-dashed text-center ${subBg}`}>
            <Radio className="w-10 h-10 mx-auto mb-2 text-amber-500 animate-pulse" />
            <h3 className="text-lg font-black">
              Warte auf ersten Transponder-Impuls an der Ziellinie...
            </h3>
            <p className="text-xs opacity-75 mt-1 max-w-xl mx-auto">
              Fahrernamen und Karts erscheinen hier automatisch, sobald ihr Transponder in KaRaS erfasst wird. Dadurch landen niemals leere Karts auf dem Ausdruck.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowManualKartDistributor(!showManualKartDistributor)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs"
              >
                🎯 Gruppen-Karts vorab manuell verteilen ({currentCard.entries.length} Fahrer)
              </button>
              <button
                type="button"
                onClick={() => setOnlyActiveTransponders(false)}
                className={`px-4 py-2 rounded-xl border font-bold text-xs ${subBg}`}
              >
                Alle geplanten Fahrer trotzdem einblenden
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase ${subBg}`}>
                  <th className="p-3 w-16 text-center">Pos</th>
                  <th className="p-3">Fahrer (Aktive Transponder)</th>
                  <th className="p-3 w-48">Kart (Manuell wählbar)</th>
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
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black ${
                          idx === 0 && entry.bestTime
                            ? 'bg-amber-500 text-black shadow'
                            : subBg
                        }`}
                      >
                        P{idx + 1}
                      </span>
                    </td>
                    <td className="p-3 font-black text-lg">{entry.driverName}</td>
                    <td className="p-3">
                      <select
                        value={entry.kartName}
                        onChange={(e) =>
                          handleManualKartChange(entry.driverId, e.target.value)
                        }
                        className="px-3 py-2 rounded-xl border-2 border-amber-500/60 bg-amber-500/15 text-amber-400 font-mono font-black text-sm w-full"
                      >
                        {activeKarts.map((k) => {
                          const occupiedBy = currentCard.entries.find(
                            (other) =>
                              other.kartName === k.name &&
                              other.driverId !== entry.driverId
                          );
                          return (
                            <option key={k.id} value={k.name} className="bg-[#1A1A1A] text-white">
                              {k.name}
                              {occupiedBy ? ` (⇄ ${occupiedBy.driverName})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="p-3 text-center font-mono font-black text-base">
                      {entry.laps}
                    </td>
                    <td className="p-3 text-center font-mono text-sm opacity-85">
                      {entry.lastTime ? `${entry.lastTime} s` : 'Aktiv'}
                    </td>
                    <td className="p-3 text-right">
                      <input
                        type="text"
                        placeholder="00.000"
                        value={entry.bestTime}
                        onChange={(e) =>
                          handleBestTimeChange(entry.driverId, e.target.value)
                        }
                        className={`w-32 px-3 py-1.5 rounded-lg border text-right font-mono font-black text-base text-amber-400 focus:outline-none focus:border-amber-500 ${subBg}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#535353]/30 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onPrintCurrentCard}
            className={`px-5 py-3 rounded-xl font-black text-sm border flex items-center hover:border-amber-500 ${subBg}`}
          >
            <Printer className="w-4 h-4 mr-2 text-amber-500" />
            🖨️ Diesen Lauf jetzt drucken (A4)
          </button>

          <button
            type="button"
            onClick={handleNextCard}
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg flex items-center transition"
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
