
export type BattleStatus = "Ongoing" | "Completed" | "Setting Up";

export interface ArmyDetails {
  id: number;
  faction: string;
  team: number;
  details: string;
  // Add more fields as needed
}

export interface Battle {
  id: string; // UUID
  battle_name: string;
  user_id: string;
  height: string;
  width: string;
  army_turn: string;
  battle_round: string;
  player_army: string; // JSON string from backend; parse to ArmyDetails if needed
  opponent_army: string; // JSON string from backend; parse to ArmyDetails if needed
  player_points: string;
  opponent_points: string;
  archived: boolean;
  timestamp: string;
}

export interface ParsedBattle extends Omit<Battle, 'player_army' | 'opponent_army'> {
  player_army: ArmyDetails;
  opponent_army: ArmyDetails;
}

export function parseBattle(battle: Battle): ParsedBattle {
  return {
    ...battle,
    player_army: JSON.parse(battle.player_army),
    opponent_army: JSON.parse(battle.opponent_army),
  };
}