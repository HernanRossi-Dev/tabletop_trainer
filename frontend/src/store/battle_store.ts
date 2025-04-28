import { createStore } from "solid-js/store";
import { Battle } from "../types/battle_type";

const LOCAL_STORAGE_KEY = "battle";

function loadBattle(): Battle {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  // Provide a default empty Battle object
  return {
    id: "",
    battle_name: "",
    user_id: "",
    height: "",
    width: "",
    army_turn: "",
    battle_round: "",
    player_army: "",
    opponent_army: "",
    player_points: "",
    opponent_points: "",
    timestamp: "",
    archived: false,
  };
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
  const emptyBattle: Battle = {
    id: "",
    battle_name: "",
    user_id: "",
    height: "",
    width: "",
    army_turn: "",
    battle_round: "",
    player_army: "",
    opponent_army: "",
    player_points: "",
    opponent_points: "",
    timestamp: "",
    archived: false,
  };
  setBattle(emptyBattle);
  persistBattle(emptyBattle);
}