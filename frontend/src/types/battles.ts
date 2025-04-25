// src/types/battle.ts (Create this file or place in a relevant types folder)
import type { ArmyConfig } from '../config/factions'; // Assuming ArmyConfig is exported from here

export interface PlayArea {
  width: number;
  height: number;
}

export type BattleStatus = "Ongoing" | "Completed" | "Setting Up";

export interface Battle {
  id: string | number; // Unique identifier for the battle
  status: BattleStatus;
  currentRound: number;
  playArea: PlayArea;
  armies: ArmyConfig[];
  // Add other relevant details:
  // scenarioName?: string;
  // startTime?: Date;
}