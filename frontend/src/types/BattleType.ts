
export type BattleStatus = "ongoing" | "completed" | "settingUp";

export interface ArmyDetails {
  id: number;
  armyName: string | null;
  armySizePoints: number | null;
  faction: string | null;
  detachment: string | null;
  characters: string[]; // Each element is a multi-line string block for one character
  otherDatasheets: string[]; // Each element is a multi-line string block for one unit
}


export function defaultArmyDetails(): ArmyDetails {
  return {
    id: 0,
    armyName: null,
    armySizePoints: null,
    faction: null,
    detachment: null,
    characters: [],
    otherDatasheets: []
  };
}

export interface BattleLog { // The history of combat messages will be of the form { 1: { "message": "text", "creator": "user"}, 2: { "message": "text", "creator": "ai"}}
  [key: number]: {
    message: string;
    creator: "user" | "ai";
  };
}

export function defaultBattleLog(): BattleLog {
  return {
    0: { message: "", creator: "user" }
  };
}

export interface Battle {
  id: string;
  battleName: string;
  userId: string;
  height: string;
  width: string;
  armyTurn: string;
  battleRound: number;
  playerArmy: ArmyDetails;
  opponentArmy: ArmyDetails;
  playerScore: number;
  opponentScore: number;
  archived: boolean;
  timestamp: string;
  battleLog: BattleLog; 
}


// Function to convert API battle object to Battle type
export function fromApiBattle(apiBattle: any): Battle {
  function safeParse(val: any, fallback: any) {
    try {
      if (!val || val === "undefined") return fallback;
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return {
    id: String(apiBattle.id),
    userId: String(apiBattle.user_id),
    battleName: apiBattle.battle_name,
    playerArmy: safeParse(apiBattle.player_army, {
      id: 0, armyName: "", armySizePoints: 0, faction: "", detachment: "", characters: [], otherDatasheets: []
    }),
    opponentArmy: safeParse(apiBattle.opponent_army, {
      id: 0, armyName: "", armySizePoints: 0, faction: "", detachment: "", characters: [], otherDatasheets: []
    }),
    height: String(apiBattle.height),
    width: String(apiBattle.width),
    armyTurn: String(apiBattle.army_turn),
    battleRound: Number(apiBattle.battle_round),
    playerScore: Number(apiBattle.player_score),
    opponentScore: Number(apiBattle.opponent_score),
    archived: Boolean(apiBattle.archived),
    timestamp: String(apiBattle.timestamp),
    battleLog: safeParse(apiBattle.battle_log, {
      0: {message: "", creator: "user"}
    }),
  };
}