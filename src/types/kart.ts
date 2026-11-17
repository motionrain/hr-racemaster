// src/types/kart.ts

export type FleetType = 'adult' | 'junior';
export type EventMode = 'gp' | 'rolling';
export type KarasState = 'waiting' | 'running' | 'stopped';
export type SessionKind = 'warmup' | 'quali' | 'final';
export type MainTab = 'setup' | 'rotation' | 'live' | 'finals' | 'print';
export type PrintViewMode =
  | 'rolling_plan'
  | 'current_card'
  | 'quali_total'
  | 'final_results'
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
  bestTime: string;   // Schnellste Runde in Sek., z.B. "41.250"
  lastTime: string;   // Letzte Überfahrt in Sek.
  laps: number;       // Gefahrene Runden (entscheidend im Finale)
  gridPos?: number;   // Startplatz im Finale (P1, P2...)
}

export interface SessionCard {
  id: string;
  title: string;
  subtitle: string;
  kind: SessionKind;
  groupName: string;
  turnIndex: number;
  karasState: KarasState;
  entries: SessionDriverEntry[];
  restingKarts: string[]; // Pausierende Karts in der Box bei ungleichen Gruppen
}

export interface OverallDriverStanding {
  driverId: number;
  driverName: string;
  groupName: string;
  turnTimes: (number | null)[];
  completedTurns: number;
  totalTime: number | null;
  bestLap: number | null;
  rank: number;
}
