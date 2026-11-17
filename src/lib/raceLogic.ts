// src/lib/raceLogic.ts
import {
  Driver,
  KartItem,
  RaceGroup,
  SessionCard,
  SessionDriverEntry,
  OverallDriverStanding,
  FinalOverallEntry,
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
 * - Finale: IMMER nach Position / Rundenanzahl (meiste Runden zuerst, bei Gleichstand Bestzeit bzw. Startplatz Pole P1)
 */
export function sortSessionEntries(card: SessionCard): SessionDriverEntry[] {
  const copy = [...card.entries];

  if (card.kind === 'final') {
    return copy.sort((a, b) => {
      if (b.laps !== a.laps) return b.laps - a.laps;
      const tA = parseFloat(a.bestTime);
      const tB = parseFloat(b.bestTime);
      const validA = !isNaN(tA) && tA > 0 ? tA : 999999;
      const validB = !isNaN(tB) && tB > 0 ? tB : 999999;
      if (validA !== validB) return validA - validB;
      return (a.gridPos ?? 99) - (b.gridPos ?? 99);
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
 * Sortierung: Immer nach der schnellsten Gesamtzeit (niedrigste Summe bei allen gefahrenen Läufen)!
 */
export function calculateOverallQualiStandings(
  groups: RaceGroup[],
  cards: SessionCard[],
  qualiTurns: number,
  mode: EventMode,
  maxKartsOnTrack: number = 8,
  activeKartsCount: number = 8
): OverallDriverStanding[] {
  const qualiCards = cards.filter((c) => c.kind === 'quali');
  const standings: OverallDriverStanding[] = [];

  groups.forEach((group) => {
    group.drivers.forEach((driver) => {
      const turnTimes: (number | null)[] = [];
      const turnKarts: string[] = [];

      for (let t = 0; t < qualiTurns; t++) {
        const card = qualiCards.find(
          (c) => c.groupName === group.name && c.turnIndex === t
        );
        const entry = card?.entries.find((e) => e.driverId === driver.id);
        const parsed = entry ? parseFloat(entry.bestTime) : NaN;
        turnTimes.push(!isNaN(parsed) && parsed > 0 ? parsed : null);
        turnKarts.push(entry?.kartName || '–');
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
        turnKarts,
        completedTurns,
        totalTime,
        bestLap,
        rank: 0,
        groupRank: 0,
        targetFinalName: '',
        targetGridPos: 0,
      });
    });
  });

  // Sortierung immer nach schnellster Gesamtzeit (bei nur 1 Lauf entspricht Gesamtzeit = Bestzeit)
  standings.sort((a, b) => {
    if (b.completedTurns !== a.completedTurns) {
      return b.completedTurns - a.completedTurns;
    }
    const sumA = a.totalTime ?? 999999;
    const sumB = b.totalTime ?? 999999;
    if (sumA !== sumB) return sumA - sumB;
    const bestA = a.bestLap ?? 999999;
    const bestB = b.bestLap ?? 999999;
    return bestA - bestB;
  });

  // Gesamtrang + Final-Zuteilung berechnen
  const cap = Math.min(Math.max(1, maxKartsOnTrack), Math.max(1, activeKartsCount));
  const groupCounters: Record<string, number> = {};

  return standings.map((s, idx) => {
    const overallRank = idx + 1;
    const tierIndex = Math.floor(idx / cap); // 0 -> Gruppe A, 1 -> Gruppe B, 2 -> Gruppe C
    const tierLetter = String.fromCharCode(65 + tierIndex);
    const targetFinalName = `Finale Gruppe ${tierLetter}`;
    const targetGridPos = (idx % cap) + 1;

    groupCounters[s.groupName] = (groupCounters[s.groupName] || 0) + 1;

    return {
      ...s,
      rank: overallRank,
      groupRank: groupCounters[s.groupName],
      targetFinalName,
      targetGridPos,
    };
  });
}

/**
 * Erzeugt aus der Quali-Gesamtwertung die Finalläufe.
 * WICHTIG: Die langsamste Gruppe startet IMMER zuerst!
 * Also z.B. erst Finale Gruppe C -> dann Finale Gruppe B -> zum Schluss Finale Gruppe A (Top-Finale).
 * Bereits erfasste Runden/Zeiten aus bestehenden Final-Karten bleiben erhalten!
 */
export function buildFinalCardsFromStandings(
  standings: OverallDriverStanding[],
  maxKartsOnTrack: number,
  activeKarts: KartItem[],
  existingFinalCards: SessionCard[] = []
): SessionCard[] {
  const cap = Math.min(Math.max(1, maxKartsOnTrack), activeKarts.length);
  if (cap <= 0 || standings.length === 0) return [];

  const finalCount = Math.ceil(standings.length / cap);
  const tiers: SessionCard[] = [];

  for (let tier = 0; tier < finalCount; tier++) {
    const letter = String.fromCharCode(65 + tier); // 0='A', 1='B', 2='C'
    const slice = standings.slice(tier * cap, (tier + 1) * cap);
    const rankFrom = tier * cap + 1;
    const rankTo = tier * cap + slice.length;

    const cardId = `final-tier-${letter}`;
    const prevCard = existingFinalCards.find((c) => c.id === cardId);

    const groupTitle =
      tier === 0
        ? `Finale Gruppe A (Top-Finale • Plätze ${rankFrom}–${rankTo})`
        : `Finale Gruppe ${letter} (Plätze ${rankFrom}–${rankTo})`;

    const entries: SessionDriverEntry[] = slice.map((st, idx) => {
      const prevEntry = prevCard?.entries.find((e) => e.driverId === st.driverId);
      return {
        driverId: st.driverId,
        driverName: st.driverName,
        kartName:
          prevEntry?.kartName ||
          activeKarts[idx % activeKarts.length]?.name ||
          `Kart ${idx + 1}`,
        bestTime: prevEntry?.bestTime || '',
        lastTime: prevEntry?.lastTime || '',
        laps: prevEntry?.laps ?? 0,
        gridPos: idx + 1,
        qualiRank: st.rank,
        qualiTime: st.totalTime,
      };
    });

    tiers.push({
      id: cardId,
      title: groupTitle,
      subtitle:
        tier === 0
          ? 'Hauptfinale um den Gesamtsieg • Wertung nach Position / Rundenanzahl'
          : `Finallauf Gruppe ${letter} • Eigene Gruppenwertung + Gesamtwertung nach Rundenanzahl`,
      kind: 'final',
      groupName: `Finale Gruppe ${letter}`,
      turnIndex: tier,
      finalTier: tier, // 0 = A (Schnellste), 1 = B, 2 = C
      karasState: prevCard?.karasState || 'waiting',
      entries,
      restingKarts: [],
    });
  }

  // Umkehren, damit die langsamste Gruppe (z.B. Gruppe B bzw. C) als ERSTES startet
  // und Gruppe A als großes Finale zum Schluss fährt!
  return tiers.reverse();
}

/**
 * Berechnet die kombinierte Finale-Gesamtwertung über alle Final-Gruppen (Gruppe A + Gruppe B + ...).
 * - Im Modus 'tiered' (Standard): Gruppe A belegt die Plätze 1..N_A (sortiert nach Runden im A-Finale),
 *   Gruppe B belegt die Plätze (N_A+1)..(N_A+N_B) (sortiert nach Runden im B-Finale).
 * - Im Modus 'direct_laps': Alle Fahrer aller Finalgruppen werden direkt nach gefahrenen Runden & Bestzeit verglichen.
 */
export function calculateCombinedFinalStandings(
  finalCards: SessionCard[],
  mode: 'tiered' | 'direct_laps' = 'tiered'
): FinalOverallEntry[] {
  if (finalCards.length === 0) return [];

  // Sortiere Gruppen von A (finalTier = 0) nach B (finalTier = 1) nach C (finalTier = 2)
  const cardsByTier = [...finalCards].sort(
    (a, b) => (a.finalTier ?? a.turnIndex) - (b.finalTier ?? b.turnIndex)
  );

  const combined: FinalOverallEntry[] = [];

  cardsByTier.forEach((card) => {
    const sortedGroupEntries = sortSessionEntries(card);
    sortedGroupEntries.forEach((entry, idx) => {
      combined.push({
        overallRank: 0,
        groupRank: idx + 1,
        finalGroupName: card.groupName,
        finalTier: card.finalTier ?? card.turnIndex,
        driverId: entry.driverId,
        driverName: entry.driverName,
        kartName: entry.kartName,
        gridPos: entry.gridPos ?? idx + 1,
        qualiRank: entry.qualiRank ?? 0,
        laps: entry.laps,
        bestTime: entry.bestTime,
        karasState: card.karasState,
      });
    });
  });

  if (mode === 'direct_laps') {
    combined.sort((a, b) => {
      if (b.laps !== a.laps) return b.laps - a.laps;
      const tA = parseFloat(a.bestTime) || 999999;
      const tB = parseFloat(b.bestTime) || 999999;
      if (tA !== tB) return tA - tB;
      return a.qualiRank - b.qualiRank;
    });
  }

  return combined.map((item, idx) => ({
    ...item,
    overallRank: idx + 1,
  }));
}
