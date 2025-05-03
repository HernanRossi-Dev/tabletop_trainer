import { createStore } from "solid-js/store";
import { Battle, defaultArmyDetails, defaultBattleLog } from "../types/BattleType";

const LOCAL_STORAGE_KEY = "battle";

function defaultBattle(): Battle {
  return {
    id: "",
    battleName: "",
    userId: "",
    height: "",
    width: "",
    armyTurn: "",
    battleRound: 0,
    playerArmy: defaultArmyDetails(),
    opponentArmy: defaultArmyDetails(),
    playerScore: 0,
    opponentScore: 0,
    timestamp: "",
    archived: false,
    battleLog: defaultBattleLog(),
  };
}

function loadBattle(): Battle {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  // Provide a default empty Battle object
  return defaultBattle();
}

export const [activeBattle, setBattle] = createStore<Battle>(loadBattle());

// Save to localStorage whenever the battle changes
function persistBattle(activeBattle: Battle) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activeBattle));
}

// Wrap setBattle to persist automatically
export function updateBattle(updater: Partial<Battle>) {
  setBattle(updater);
  persistBattle({ ...activeBattle, ...updater });
}

export function replaceBattle(newBattle: Battle) {
  setBattle(newBattle);
  persistBattle(newBattle);
}

export function clearBattle() {
  const emptyBattle: Battle = defaultBattle();
  setBattle(emptyBattle);
  persistBattle(emptyBattle);
}