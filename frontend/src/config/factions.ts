// src/config/factions.ts (or place it directly in your component file if preferred)
export const WARHAMMER_40K_FACTIONS = [
    // Imperium
    "Adepta Sororitas",
    "Adeptus Custodes",
    "Adeptus Mechanicus",
    "Astra Militarum",
    "Black Templars",
    "Blood Angels",
    "Dark Angels",
    "Deathwatch",
    "Grey Knights",
    "Imperial Fists",
    "Imperial Knights",
    "Iron Hands",
    "Raven Guard",
    "Salamanders",
    "Space Marines", // Codex Space Marines
    "Space Wolves",
    "Ultramarines",
    "White Scars",
    // Chaos
    "Chaos Daemons",
    "Chaos Knights",
    "Chaos Space Marines",
    "Death Guard",
    "Thousand Sons",
    "World Eaters",
    // Xenos
    "Aeldari", // Craftworlds
    "Drukhari",
    "Genestealer Cults",
    "Leagues of Votann",
    "Necrons",
    "Orks",
    "T'au Empire",
    "Tyranids",
    // Add any others you want to support
  ];
  
  // Interface for an army's configuration
  export interface ArmyConfig {
    id: number; // Unique ID for reactivity stability
    faction: string;
    team: number;
    // Add other army-specific settings if needed, e.g., isAI: boolean
  }