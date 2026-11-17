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

export function isEntryActive(entry: SessionDriverEntry): boolean {
  const bt = parseFloat(entry.bestTime);
  const lt = parseFloat(entry.lastTime);
  return Boolean(
    entry.transponderActive ||
      entry.laps > 0 ||
      (!isNaN(bt) && bt > 0) ||
      (!isNaN(lt) && lt > 0)
  );
}

export function buildBalancedGroups(
  drivers: Driver[],
  maxKartsOnTrack: number,
  activeKarts: KartItem[],
  customGroupKarts: Record<string, string[]> = {}
): RaceGroup[] {
  const availableCount = Math.max(1, activeKarts.length);
  const safeMax = Math.max(1, maxKartsOnTrack || 1);
  const effectiveLimit = Math.min(safeMax, availableCount);
  if (drivers.length === 0 || effectiveLimit <= 0) return [];

  const groupCount = Math.ceil(drivers.length / effectiveLimit);
  const baseSize = Math.floor(drivers.length / groupCount);
  let remainder = drivers.length % groupCount;

  const groups: RaceGroup[] = [];
  let cursor = 0;
  const activeNames = activeKarts.map((k) => k.name);

  for (let i = 0; i < groupCount; i++) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const groupName = `Gruppe ${String.fromCharCode(65 + i)}`;
    const groupDrivers = drivers.slice(cursor, cursor + size);
    cursor += size;

    const manualList = (customGroupKarts[groupName] || []).filter((kn) =>
      activeNames.includes(kn)
    );

    const poolSize = Math.max(size, manualList.length);
    const assignedKarts: string[] = [...manualList];

    for (const kn of activeNames) {
      if (assignedKarts.length >= poolSize) break;
      if (!assignedKarts.includes(kn)) {
        assignedKarts.push(kn);
      }
    }

    while (assignedKarts.length < size && activeNames.length > 0) {
      assignedKarts.push(activeNames[assignedKarts.length % activeNames.length]);
    }

    groups.push({
      id: `grp-${i}`,
      name: groupName,
      drivers: groupDrivers,
      assignedKarts,
    });
  }

  return groups;
}

export function getQualiTurnCount(
  mode: EventMode,
  gpQualiCount: number,
  groups: RaceGroup[]
): number {
  if (mode === 'gp') return Math.max(1, gpQualiCount);
  return Math.max(
    1,
    groups.reduce((max, g) => Math.max(max, g.drivers.length), 0)
  );
}

export function generateQualiSessionCards(
  groups: RaceGroup[],
  activeKarts: KartItem[],
  mode: EventMode,
  hasWarmup: boolean,
  qualiTurns: number,
  existingCards: SessionCard[] = []
): SessionCard[] {
  const cards: SessionCard[] = [];
  if (groups.length === 0 || activeKarts.length === 0) return cards;

  if (hasWarmup) {
    groups.forEach((group) => {
      const cardId = `warmup-${group.id}`;
      const prevCard = existingCards.find((c) => c.id === cardId);
      const groupPool =
        group.assignedKarts.length > 0
          ? group.assignedKarts
          : activeKarts.map((k) => k.name);

      const entries: SessionDriverEntry[] = group.drivers.map((d, dIdx) => {
        const prevEntry = prevCard?.entries.find((e) => e.driverId === d.id);
        const defaultKart = groupPool[dIdx % groupPool.length] || `Kart ${dIdx + 1}`;
        return {
          driverId: d.id,
          driverName: d.name,
          kartName: prevEntry?.kartName || defaultKart,
          bestTime: prevEntry?.bestTime || '',
          lastTime: prevEntry?.lastTime || '',
          laps: prevEntry?.laps ?? 0,
          transponderActive: prevEntry?.transponderActive ?? false,
        };
      });

      cards.push({
        id: cardId,
        title: `Warm-up • ${group.name}`,
        subtitle: 'Freies Training • Live-Sortierung nach schnellster Runde',
        kind: 'warmup',
        groupName: group.name,
        turnIndex: -1,
        karasState: prevCard?.karasState || 'waiting',
        entries,
        restingKarts: [],
      });
    });
  }

  for (let t = 0; t < qualiTurns; t++) {
    groups.forEach((group) => {
      const cardId = `quali-${group.id}-t${t + 1}`;
      const prevCard = existingCards.find((c) => c.id === cardId);

      const groupPool =
        group.assignedKarts.length >= group.drivers.length
          ? group.assignedKarts
          : activeKarts.slice(0, Math.max(group.drivers.length, 1)).map((k) => k.name);

      const usedKartNames = new Set<string>();

      const entries: SessionDriverEntry[] = group.drivers.map((d, dIdx) => {
        const prevEntry = prevCard?.entries.find((e) => e.driverId === d.id);
        const kartIdx =
          mode === 'rolling'
            ? (dIdx + t) % groupPool.length
            : dIdx % groupPool.length;
        const rotatedKart = groupPool[kartIdx] || `Kart ${dIdx + 1}`;

        const finalKart =
          prevCard && prevCard.karasState !== 'waiting' && prevEntry?.kartName
            ? prevEntry.kartName
            : rotatedKart;

        usedKartNames.add(finalKart);

        return {
          driverId: d.id,
          driverName: d.name,
          kartName: finalKart,
          bestTime: prevEntry?.bestTime || '',
          lastTime: prevEntry?.lastTime || '',
          laps: prevEntry?.laps ?? 0,
          transponderActive: prevEntry?.transponderActive ?? false,
        };
      });

      const restingKarts = groupPool.filter((name) => !usedKartNames.has(name));

      cards.push({
        id: cardId,
        title:
          mode === 'rolling'
            ? `KartRolling Lauf ${t + 1}/${qualiTurns} • ${group.name}`
            : `Qualifying ${t + 1}/${qualiTurns} • ${group.name}`,
        subtitle:
          mode === 'rolling'
            ? 'Jeder fährt jedes Kart der Gruppe • Bestzeit zählt für die Gesamtsumme'
            : 'Qualifikationslauf • Live-Sortierung nach schnellster Runde',
        kind: 'quali',
        groupName: group.name,
        turnIndex: t,
        karasState: prevCard?.karasState || 'waiting',
        entries,
        restingKarts,
      });
    });
  }

  return cards;
}

export function applyGroupKartPoolToCards(
  cards: SessionCard[],
  groupName: string,
  newGroupKarts: string[],
  mode: EventMode
): SessionCard[] {
  if (newGroupKarts.length === 0) return cards;

  return cards.map((card) => {
    if (card.groupName !== groupName || card.karasState !== 'waiting') {
      return card;
    }
    const t = Math.max(0, card.turnIndex);
    const used = new Set<string>();
    const updatedEntries = card.entries.map((entry, dIdx) => {
      const kartIdx =
        mode === 'rolling' && card.kind === 'quali'
          ? (dIdx + t) % newGroupKarts.length
          : dIdx % newGroupKarts.length;
      const assigned = newGroupKarts[kartIdx] || entry.kartName;
      used.add(assigned);
      return {
        ...entry,
        kartName: assigned,
      };
    });

    return {
      ...card,
      entries: updatedEntries,
      restingKarts: newGroupKarts.filter((k) => !used.has(k)),
    };
  });
}

export function sortSessionEntries(
  card: SessionCard,
  onlyActiveTransponders: boolean = false
): SessionDriverEntry[] {
  const base = onlyActiveTransponders
    ? card.entries.filter(isEntryActive)
    : [...card.entries];

  if (card.kind === 'final') {
    return base.sort((a, b) => {
      if (b.laps !== a.laps) return b.laps - a.laps;
      const tA = parseFloat(a.bestTime);
      const tB = parseFloat(b.bestTime);
      const validA = !isNaN(tA) && tA > 0 ? tA : 999999;
      const validB = !isNaN(tB) && tB > 0 ? tB : 999999;
      if (validA !== validB) return validA - validB;
      return (a.gridPos ?? 99) - (b.gridPos ?? 99);
    });
  }

  return base.sort((a, b) => {
    const tA = parseFloat(a.bestTime);
    const tB = parseFloat(b.bestTime);
    const validA = !isNaN(tA) && tA > 0 ? tA : 999999;
    const validB = !isNaN(tB) && tB > 0 ? tB : 999999;
    if (validA !== validB) return validA - validB;
    if (b.laps !== a.laps) return b.laps - a.laps;
    return a.driverId - b.driverId;
  });
}

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
      let anyActivity = false;

      for (let t = 0; t < qualiTurns; t++) {
        const card = qualiCards.find(
          (c) => c.groupName === group.name && c.turnIndex === t
        );
        const entry = card?.entries.find((e) => e.driverId === driver.id);
        if (entry && isEntryActive(entry)) {
          anyActivity = true;
        }
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
        hasAnyActivity: anyActivity || completedTurns > 0,
        rank: 0,
        groupRank: 0,
        targetFinalName: '',
        targetGridPos: 0,
      });
    });
  });

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

  const cap = Math.min(Math.max(1, maxKartsOnTrack), Math.max(1, activeKartsCount));
  const groupCounters: Record<string, number> = {};

  return standings.map((s, idx) => {
    const overallRank = idx + 1;
    const tierIndex = Math.floor(idx / cap);
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

export function buildFinalCardsFromStandings(
  standings: OverallDriverStanding[],
  maxKartsOnTrack: number,
  activeKarts: KartItem[],
  existingFinalCards: SessionCard[] = [],
  groups: RaceGroup[] = []
): SessionCard[] {
  const cap = Math.min(Math.max(1, maxKartsOnTrack), Math.max(1, activeKarts.length));
  if (cap <= 0 || standings.length === 0) return [];

  const hasAnyQualiData = standings.some((s) => s.hasAnyActivity);
  const eligibleStandings = hasAnyQualiData
    ? standings.filter((s) => s.hasAnyActivity)
    : standings;

  const finalCount = Math.ceil(eligibleStandings.length / cap);
  const tiers: SessionCard[] = [];

  for (let tier = 0; tier < finalCount; tier++) {
    const letter = String.fromCharCode(65 + tier);
    const slice = eligibleStandings.slice(tier * cap, (tier + 1) * cap);
    const rankFrom = tier * cap + 1;
    const rankTo = tier * cap + slice.length;

    const cardId = `final-tier-${letter}`;
    const prevCard = existingFinalCards.find((c) => c.id === cardId);
    const matchingGroup = groups.find((g) => g.name === `Gruppe ${letter}`) || groups[0];
    const kartPool =
      matchingGroup && matchingGroup.assignedKarts.length > 0
        ? matchingGroup.assignedKarts
        : activeKarts.map((k) => k.name);

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
          kartPool[idx % kartPool.length] ||
          `Kart ${idx + 1}`,
        bestTime: prevEntry?.bestTime || '',
        lastTime: prevEntry?.lastTime || '',
        laps: prevEntry?.laps ?? 0,
        transponderActive: prevEntry?.transponderActive ?? false,
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
      finalTier: tier,
      karasState: prevCard?.karasState || 'waiting',
      entries,
      restingKarts: [],
    });
  }

  return tiers.reverse();
}

export function calculateCombinedFinalStandings(
  finalCards: SessionCard[],
  mode: 'tiered' | 'direct_laps' = 'tiered',
  onlyActive: boolean = false
): FinalOverallEntry[] {
  if (finalCards.length === 0) return [];

  const cardsByTier = [...finalCards].sort(
    (a, b) => (a.finalTier ?? a.turnIndex) - (b.finalTier ?? b.turnIndex)
  );

  const combined: FinalOverallEntry[] = [];

  cardsByTier.forEach((card) => {
    const sortedGroupEntries = sortSessionEntries(card, onlyActive);
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
        transponderActive: entry.transponderActive,
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
