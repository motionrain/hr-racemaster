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
  active: boolean;
}

export interface Driver {
  id: number;
  name: string;
}

export interface RaceGroup {
  id: string;
  name: string;
  drivers: Driver[];
  assignedKarts: string[];
}

export interface SessionDriverEntry {
  driverId: number;
  driverName: string;
  kartName: string;
  bestTime: string;
  lastTime: string;
  laps: number;
  transponderActive?: boolean;
  gridPos?: number;
  qualiRank?: number;
  qualiTime?: number | null;
}

export interface SessionCard {
  id: string;
  title: string;
  subtitle: string;
  kind: SessionKind;
  groupName: string;
  turnIndex: number;
  finalTier?: number;
  karasState: KarasState;
  entries: SessionDriverEntry[];
  restingKarts: string[];
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
  hasAnyActivity: boolean;
  rank: number;
  groupRank: number;
  targetFinalName: string;
  targetGridPos: number;
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
  transponderActive?: boolean;
  karasState: KarasState;
}
