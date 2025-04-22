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
  const [playAreaWidth, setPlayAreaWidth] = createSignal(44); // Common Strike Force size
  const [playAreaHeight, setPlayAreaHeight] = createSignal(30); // Common Strike Force size

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

  const handleStartGame = () => {
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
      armies: armies(), // Contains faction and team for each army
    };

    console.log("Starting Game with Settings:", gameSettings);
    // TODO: Navigate to the game screen or send settings to the game engine/state manager
    alert(`Starting game on ${playAreaWidth()}x${playAreaHeight()} board with ${numberOfArmies()} armies! Check console for details.`);
  };

  // --- Render Logic ---

  return (
    <div class={styles.setupContainer}>
      <h1>Sector Command AI - Game Setup</h1>

      {/* --- Play Area Section --- */}
      <fieldset class={styles.fieldset}>
        <legend>Play Area (Inches)</legend>
        <div class={styles.inputGroup}>
          <label for="widthInput">Width:</label>
          <input
            id="widthInput"
            type="number"
            min="1"
            value={playAreaWidth()}
            onInput={(e) => setPlayAreaWidth(parseInt(e.currentTarget.value, 10) || 0)}
            class={styles.numberInput}
          />
        </div>
        <div class={styles.inputGroup}>
          <label for="heightInput">Height:</label>
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
        <legend>Armies ({numberOfArmies()})</legend>
        <div class={styles.armyControl}>
          <button onClick={addArmy} disabled={!canAddArmy()} class={styles.button}>
            Add Army (+)
          </button>
          <button onClick={removeArmy} disabled={!canRemoveArmy()} class={styles.button}>
            Remove Army (-)
          </button>
        </div>

        {/* Loop through armies using <For> */}
        <For each={armies()}>
          {(army, index) => (
            <fieldset class={styles.armyConfig}>
              <legend>Army {index() + 1} {index() === 0 ? "(Player)" : "(AI)"}</legend> {/* Convention: Army 1 is Player */}

              {/* Faction Selection */}
              <div class={styles.inputGroup}>
                <label for={`factionSelect-${army.id}`}>Faction:</label>
                <select
                  id={`factionSelect-${army.id}`}
                  value={army.faction}
                  onChange={(e) => updateArmyConfig(army.id, 'faction', e.currentTarget.value)}
                  class={styles.selectInput}
                  required // HTML5 validation hint
                >
                  <option value="" disabled>-- Select Faction --</option>
                  <For each={WARHAMMER_40K_FACTIONS}>
                    {(factionName) => <option value={factionName}>{factionName}</option>}
                  </For>
                </select>
              </div>

              {/* Team Assignment */}
              <div class={styles.inputGroup}>
                <label for={`teamInput-${army.id}`}>Team:</label>
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
      <button onClick={handleStartGame} class={`${styles.button} ${styles.startButton}`}>
        Start Game
      </button>
    </div>
  );
}

export default GameSetupPage;