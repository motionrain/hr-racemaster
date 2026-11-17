// src/types/kart.ts

export type FleetType = 'adult' | 'junior';
export type EventMode = 'gp' | 'rolling';
export type KarasState = 'waiting' | 'running' | 'stopped';
export type SessionKind = 'warmup' | 'quali' | 'final';
export type MainTab = 'setup' | 'rotation' | 'live' | 'finals' | 'print';
export type PrintViewMode =
  | 'rolling_plan'
  | 'quali_total'
  | 'current_card'
  | 'final_group'
  | 'final_overall'
  | 'certificate';

export interface KartItem {
  id: number;
  name: string;
  active: boolean; // true = Fahrbereit, false = Defekt / Gesperrt
}

export interface Driver {
  id: number;
  name: string;
}

export interface RaceGroup {
  id: string;
  name: string;
  drivers: Driver[];
}

export interface SessionDriverEntry {
  driverId: number;
  driverName: string;
  kartName: string;
  bestTime: string;       // Schnellste Runde in Sek., z.B. "41.250"
  lastTime: string;       // Letzte Überfahrt in Sek.
  laps: number;           // Gefahrene Runden (entscheidend im Finale)
  gridPos?: number;       // Startplatz im jeweiligen Finale (Pole P1, P2...)
  qualiRank?: number;     // Gesamtrang aus dem Qualifying (#1, #2...)
  qualiTime?: number | null; // Gesamtzeit aus dem Qualifying
}

export interface SessionCard {
  id: string;
  title: string;
  subtitle: string;
  kind: SessionKind;
  groupName: string;
  turnIndex: number;
  finalTier?: number;     // 0 = Gruppe A (Schnellste), 1 = Gruppe B, 2 = Gruppe C...
  karasState: KarasState;
  entries: SessionDriverEntry[];
  restingKarts: string[]; // Pausierende Karts in der Box bei ungleichen Gruppen
}

export interface OverallDriverStanding {
  driverId: number;
  driverName: string;
  groupName: string;
  turnTimes: (number | null)[];
  turnKarts: string[];
  completedTurns: number;
  totalTime: number | null;
  bestLap: number | null;
  rank: number;           // Gesamtrang über alle Fahrer (#1, #2...)
  groupRank: number;      // Rang innerhalb der eigenen Gruppe (P1, P2...)
  targetFinalName: string; // z.B. "Finale Gruppe A" oder "Finale Gruppe B"
  targetGridPos: number;   // Startplatz im zugeteilten Finale (P1, P2...)
}

export interface FinalOverallEntry {
  overallRank: number;
  groupRank: number;
  finalGroupName: string;
  finalTier: number;
  driverId: number;
  driverName: string;
  kartName: string;
  gridPos: number;
  qualiRank: number;
  laps: number;
  bestTime: string;
  karasState: KarasState;
}
