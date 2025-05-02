
export type BattleStatus = "Ongoing" | "Completed" | "Setting Up";

export interface ArmyDetails {
  id: number;
  faction: string;
  team: number;
  details: string;
  detachment: string;
  army_size: number;
  
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
  player_score: string;
  opponent_score: string;
  archived: boolean;
  timestamp: string;
  battle_log: string; // The history of combat messages will be of the form { 1: { "message": "text", "creator": "user"}, 2: { "message": "text", "creator": "ai"}}
}

export interface ParsedBattle extends Omit<Battle, 'player_army' | 'opponent_army'> {
  player_army: ArmyDetails;
  opponent_army: ArmyDetails;
}

export function parseBattle(battle: Battle): ParsedBattle {
  function safeParse(val: any, fallback: any) {
    try {
      if (!val || val === "undefined") return fallback;
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return {
    ...battle,
    player_army: safeParse(battle.player_army, {
      id: 0, faction: "", team: 1, details: "", detachment: "", army_size: 0
    }),
    opponent_army: safeParse(battle.opponent_army, {
      id: 0, faction: "", team: 2, details: "", detachment: "", army_size: 0
    }),
    battle_log: safeParse(battle.battle_log, {}),
  };
}