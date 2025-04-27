// src/pages/GameSetupPage.tsx
import { createSignal, For, createEffect, batch } from 'solid-js';
import { WARHAMMER_40K_FACTIONS } from '../config/factions'; // Adjust path if needed
import styles from './GameSetupPage.module.css'; // Optional: For styling

// Simple ID generator
let nextArmyId = 0;
const createNewArmy = () => ({
  id: nextArmyId++,
  faction: "", // Default to empty or a specific default faction
  team: 1,     // Default to team 1
});

function GameSetupPage() {
  // --- State Signals ---

  // Play Area
  const [playAreaWidth, setPlayAreaWidth] = createSignal(44);
  const [playAreaHeight, setPlayAreaHeight] = createSignal(30);
  const [battleName, setBattleName] = createSignal('Default Battle');

  // Armies
  const [armies, setArmies] = createSignal([createNewArmy(), createNewArmy()]); // Start with Player vs AI

  // Min/Max armies (adjust as needed)
  const MIN_ARMIES = 2;
  const MAX_ARMIES = 4; // Example limit

  // --- Computed Values (derived signals) ---
  const numberOfArmies = () => armies().length;
  const canAddArmy = () => numberOfArmies() < MAX_ARMIES;
  const canRemoveArmy = () => numberOfArmies() > MIN_ARMIES;

  // --- Event Handlers ---

  const addArmy = () => {
    if (canAddArmy()) {
      setArmies([...armies(), createNewArmy()]);
    }
  };

  const removeArmy = () => {
    if (canRemoveArmy()) {
      // Remove the last army
      setArmies(armies().slice(0, -1));
    }
  };

  // Update a specific field (faction or team) for a given army ID
  const updateArmyConfig = (id, field, value) => {
    setArmies(prevArmies =>
      prevArmies.map(army =>
        army.id === id ? { ...army, [field]: value } : army
      )
    );
  };

  const handleCreateBattle = async () => {
    // Validation (basic example)
    if (armies().some(army => !army.faction)) {
       alert("Please select a faction for every army.");
       return;
    }
     if (playAreaWidth() <= 0 || playAreaHeight() <= 0) {
       alert("Please enter valid play area dimensions.");
       return;
    }

    const gameSettings = {
      playArea: {
        width: playAreaWidth(),
        height: playAreaHeight(),
      },
      userId: "ede8d924-7aa7-42f6-99c9-6a291dce7815", // Placeholder for user ID
      playerArmy: armies()[0], // Contains faction and team for each army
      opponentArmy: armies()[1], // Contains faction and team for each army
      battleName: battleName(), // Contains faction and team for each army
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/create_battle', {
      // const response = await fetch('http://10.0.0.20:50000/api/create_battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameSettings),
      });
  
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Battle created:", data);
      alert(`Battle created! ID: ${data.battle_id || 'unknown'}`);

    } catch (error) {
      console.error("Failed to create battle:", error);
      alert("Failed to create battle. See console for details.");
    }
  };

  // --- Render Logic ---

  return (
    <div class={styles.setupContainer}>
      <h1 style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#2e3a59" }}>
        Battle Command AI - Game Setup
      </h1>

            {/* --- Battle Info Section --- */}
        <fieldset class={styles.fieldset}>
        <legend style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Battle Details</legend>
 
        <div class={styles.inputGroup}>
        <label for="battleInput" style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Battle Name:</label>
          <input
            id="battleInput"
            type="string"
            value={battleName()}
            onInput={(e) => setBattleName(e.currentTarget.value)}
            class={styles.numberInput}
          />   
        </div>
      </fieldset>

      {/* --- Play Area Section --- */}
      <fieldset class={styles.fieldset}>
        <legend style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Play Area (Inches)</legend>
        <div class={styles.inputGroup}>

          <label for="widthInput" style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Width:</label>      
          <input
            id="widthInput"
            type="number"
            min="1"
            value={playAreaWidth()}
            onInput={(e) => setPlayAreaWidth(parseInt(e.currentTarget.value, 10) || 0)}
            class={styles.numberInput}
          />
          <label for="heightInput" style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Height:</label>
          <input
            id="heightInput"
            type="number"
            min="1"
            value={playAreaHeight()}
            onInput={(e) => setPlayAreaHeight(parseInt(e.currentTarget.value, 10) || 0)}
            class={styles.numberInput}
          />
        </div>
      </fieldset>

      {/* --- Armies Section --- */}
      <fieldset class={styles.fieldset}>
        <legend style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>
          Armies
          {/* Armies ({numberOfArmies()}) */}
        </legend>
        <div class={styles.armyControl}>
          {/* <button onClick={addArmy} disabled={!canAddArmy()} class={styles.button}>
            Add Army (+)
          </button>
          <button onClick={removeArmy} disabled={!canRemoveArmy()} class={styles.button}>
            Remove Army (-)
          </button> */}
        </div>

        {/* Loop through armies using <For> */}
        <For each={armies()}>
          {(army, index) => (
            <fieldset class={styles.armyConfig}>
              <legend style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>
                Army {index() + 1} {index() === 0 ? "(Player)" : "(AI)"}
              </legend>

              {/* Faction Selection */}
              <div class={styles.inputGroup}>
                <label for={`factionSelect-${army.id}`} style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>
                  Faction:
                </label>
                <select
                  id={`factionSelect-${army.id}`}
                  value={army.faction}
                  onChange={(e) => updateArmyConfig(army.id, 'faction', e.currentTarget.value)}
                  class={styles.selectInput}
                  required
                >
                  <option value="" disabled>-- Select Faction --</option>
                  <For each={WARHAMMER_40K_FACTIONS}>
                    {(factionName) => <option value={factionName}>{factionName}</option>}
                  </For>
                </select>
              </div>

              {/* Team Assignment */}
              <div class={styles.inputGroup}>
                <label for={`teamInput-${army.id}`} style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>
                  Team:
                </label>
                <input
                  id={`teamInput-${army.id}`}
                  type="number"
                  min="1"
                  value={army.team}
                  onInput={(e) => updateArmyConfig(army.id, 'team', parseInt(e.currentTarget.value, 10) || 1)}
                  class={styles.numberInput}
                 />
              </div>
            </fieldset>
          )}
        </For>
      </fieldset>

      {/* --- Start Game Button --- */}
      <button
        onClick={handleCreateBattle}
        class={`${styles.button} ${styles.startButton}`}
        style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#fff", "backgroundColor": "#2e3a59" }}
      >
        Create Battle
      </button>
    </div>
  );
}

export default GameSetupPage;