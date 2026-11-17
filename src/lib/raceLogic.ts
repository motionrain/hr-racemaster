// src/lib/raceLogic.ts
import {
  Driver,
  KartItem,
  RaceGroup,
  SessionCard,
  SessionDriverEntry,
  OverallDriverStanding,
  EventMode,
} from '../types/kart';

export const ADULT_FLEET: KartItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  name: `Kart ${i + 1}`,
  active: true,
}));

export const JUNIOR_FLEET: KartItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Kids ${i + 1}`,
  active: true,
}));

/**
 * Teilt Fahrer fair auf Gruppen auf (z.B. 22 Fahrer bei Max 8 -> 8, 7, 7)
 */
export function buildBalancedGroups(
  drivers: Driver[],
  maxKartsOnTrack: number,
  availableKartsCount: number
): RaceGroup[] {
  const safeMax = Math.max(1, maxKartsOnTrack || 1);
  const effectiveLimit = Math.min(safeMax, Math.max(1, availableKartsCount));
  if (drivers.length === 0 || effectiveLimit <= 0) return [];

  const groupCount = Math.ceil(drivers.length / effectiveLimit);
  const baseSize = Math.floor(drivers.length / groupCount);
  let remainder = drivers.length % groupCount;

  const groups: RaceGroup[] = [];
  let cursor = 0;

  for (let i = 0; i < groupCount; i++) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    groups.push({
      id: `grp-${i}`,
      name: `Gruppe ${String.fromCharCode(65 + i)}`,
      drivers: drivers.slice(cursor, cursor + size),
    });
    cursor += size;
  }

  return groups;
}

/**
 * Bestimmt die Anzahl der Quali-Turns:
 * - GP: gewählte Anzahl (1, 2, 3...)
 * - KartRolling: Größe der größten Gruppe (alle Gruppen fahren exakt gleich viele Turns)
 */
export function getQualiTurnCount(
  mode: EventMode,
  gpQualiCount: number,
  groups: RaceGroup[]
): number {
  if (mode === 'gp') return Math.max(1, gpQualiCount);
  return groups.reduce((max, g) => Math.max(max, g.drivers.length), 0);
}

/**
 * Erzeugt alle chronologischen Session-Karten (Warm-up -> Quali 1..N)
 */
export function generateQualiSessionCards(
  groups: RaceGroup[],
  activeKarts: KartItem[],
  mode: EventMode,
  hasWarmup: boolean,
  qualiTurns: number
): SessionCard[] {
  const cards: SessionCard[] = [];
  if (groups.length === 0 || activeKarts.length === 0) return cards;

  const maxGroupSize = groups.reduce((max, g) => Math.max(max, g.drivers.length), 0);
  const poolSize =
    mode === 'rolling' ? Math.min(maxGroupSize, activeKarts.length) : activeKarts.length;
  const rotationPool = activeKarts.slice(0, poolSize);

  // 1. Optionales Warm-up
  if (hasWarmup) {
    groups.forEach((group) => {
      const entries: SessionDriverEntry[] = group.drivers.map((d, dIdx) => ({
        driverId: d.id,
        driverName: d.name,
        kartName: rotationPool[dIdx % rotationPool.length]?.name || '–',
        bestTime: '',
        lastTime: '',
        laps: 0,
      }));

      cards.push({
        id: `warmup-${group.id}`,
        title: `Warm-up • ${group.name}`,
        subtitle: 'Freies Training • Live-Sortierung nach schnellster Runde',
        kind: 'warmup',
        groupName: group.name,
        turnIndex: -1,
        karasState: 'waiting',
        entries,
        restingKarts: [],
      });
    });
  }

  // 2. Qualifying-Läufe (Lauf 1 bis Lauf N)
  for (let t = 0; t < qualiTurns; t++) {
    groups.forEach((group) => {
      const usedKartNames = new Set<string>();

      const entries: SessionDriverEntry[] = group.drivers.map((d, dIdx) => {
        const kartIdx =
          mode === 'rolling'
            ? (dIdx + t) % rotationPool.length
            : dIdx % rotationPool.length;
        const assigned = rotationPool[kartIdx]?.name || '–';
        usedKartNames.add(assigned);

        return {
          driverId: d.id,
          driverName: d.name,
          kartName: assigned,
          bestTime: '',
          lastTime: '',
          laps: 0,
        };
      });

      const restingKarts =
        mode === 'rolling'
          ? rotationPool.map((k) => k.name).filter((name) => !usedKartNames.has(name))
          : [];

      cards.push({
        id: `quali-${group.id}-t${t + 1}`,
        title:
          mode === 'rolling'
            ? `KartRolling Lauf ${t + 1}/${qualiTurns} • ${group.name}`
            : `Qualifying ${t + 1}/${qualiTurns} • ${group.name}`,
        subtitle:
          mode === 'rolling'
            ? 'Jeder fährt jedes Kart • Bestzeit zählt für die Gesamtsumme'
            : 'Qualifikationslauf • Live-Sortierung nach schnellster Runde',
        kind: 'quali',
        groupName: group.name,
        turnIndex: t,
        karasState: 'waiting',
        entries,
        restingKarts,
      });
    });
  }

  return cards;
}

/**
 * Sortiert Fahrer innerhalb einer Karte:
 * - Warm-up & Qualifying: Nach schnellster Runde (aufsteigend)
 * - Finale: Nach Rundenanzahl (absteigend), bei Gleichstand nach Bestzeit
 */
export function sortSessionEntries(card: SessionCard): SessionDriverEntry[] {
  const copy = [...card.entries];

  if (card.kind === 'final') {
    return copy.sort((a, b) => {
      if (b.laps !== a.laps) return b.laps - a.laps;
      const tA = parseFloat(a.bestTime) || 999999;
      const tB = parseFloat(b.bestTime) || 999999;
      return tA - tB;
    });
  }

  return copy.sort((a, b) => {
    const tA = parseFloat(a.bestTime);
    const tB = parseFloat(b.bestTime);
    const validA = !isNaN(tA) && tA > 0 ? tA : 999999;
    const validB = !isNaN(tB) && tB > 0 ? tB : 999999;
    return validA - validB;
  });
}

/**
 * Berechnet die Qualifying-Gesamtwertung über alle Gruppen & Läufe
 */
export function calculateOverallQualiStandings(
  groups: RaceGroup[],
  cards: SessionCard[],
  qualiTurns: number,
  mode: EventMode
): OverallDriverStanding[] {
  const qualiCards = cards.filter((c) => c.kind === 'quali');
  const standings: OverallDriverStanding[] = [];

  groups.forEach((group) => {
    group.drivers.forEach((driver) => {
      const turnTimes: (number | null)[] = [];

      for (let t = 0; t < qualiTurns; t++) {
        const card = qualiCards.find(
          (c) => c.groupName === group.name && c.turnIndex === t
        );
        const entry = card?.entries.find((e) => e.driverId === driver.id);
        const parsed = entry ? parseFloat(entry.bestTime) : NaN;
        turnTimes.push(!isNaN(parsed) && parsed > 0 ? parsed : null);
      }

      const validTimes = turnTimes.filter((v): v is number => v !== null);
      const completedTurns = validTimes.length;
      const totalTime =
        completedTurns > 0 ? validTimes.reduce((a, b) => a + b, 0) : null;
      const bestLap = completedTurns > 0 ? Math.min(...validTimes) : null;

      standings.push({
        driverId: driver.id,
        driverName: driver.name,
        groupName: group.name,
        turnTimes,
        completedTurns,
        totalTime,
        bestLap,
        rank: 0,
      });
    });
  });

  standings.sort((a, b) => {
    if (qualiTurns > 1 || mode === 'rolling') {
      if (b.completedTurns !== a.completedTurns) {
        return b.completedTurns - a.completedTurns;
      }
      const sumA = a.totalTime ?? 999999;
      const sumB = b.totalTime ?? 999999;
      return sumA - sumB;
    } else {
      const bestA = a.bestLap ?? 999999;
      const bestB = b.bestLap ?? 999999;
      return bestA - bestB;
    }
  });

  return standings.map((s, idx) => ({ ...s, rank: idx + 1 }));
}

/**
 * Erzeugt aus der Quali-Gesamtwertung die Finalläufe (A-, B-, C-Finale)
 */
export function buildFinalCardsFromStandings(
  standings: OverallDriverStanding[],
  maxKartsOnTrack: number,
  activeKarts: KartItem[]
): SessionCard[] {
  const cap = Math.min(Math.max(1, maxKartsOnTrack), activeKarts.length);
  if (cap <= 0 || standings.length === 0) return [];

  const finalCount = Math.ceil(standings.length / cap);
  const labels = ['A-Finale (Um den Gesamtsieg)', 'B-Finale', 'C-Finale', 'D-Finale'];
  const finals: SessionCard[] = [];

  for (let f = 0; f < finalCount; f++) {
    const slice = standings.slice(f * cap, (f + 1) * cap);
    const entries: SessionDriverEntry[] = slice.map((st, idx) => ({
      driverId: st.driverId,
      driverName: st.driverName,
      kartName: activeKarts[idx]?.name || `Kart ${idx + 1}`,
      bestTime: '',
      lastTime: '',
      laps: 0,
      gridPos: idx + 1,
    }));

    finals.push({
      id: `final-${f}`,
      title: labels[f] || `Finale ${f + 1}`,
      subtitle: 'Finalrennen • Wertung nach Rundenanzahl (Tie-Breaker: Bestzeit)',
      kind: 'final',
      groupName: labels[f] || `Finale ${f + 1}`,
      turnIndex: f,
      karasState: 'waiting',
      entries,
      restingKarts: [],
    });
  }

  return finals;
}
