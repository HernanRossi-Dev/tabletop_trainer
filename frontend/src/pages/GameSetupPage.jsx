import { createSignal, For} from 'solid-js';
import { WARHAMMER_40K_FACTIONS } from '../config/factions';
import styles from './GameSetupPage.module.css';
import { user } from '../store/user_store';
import {
  Typography,
} from "@suid/material";
import Modal from "@suid/material/Modal";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import CheckCircleIcon from "@suid/icons-material/CheckCircle";
import { useNavigate } from "@solidjs/router";


let nextArmyId = 0;
const createNewArmy = () => ({
  id: nextArmyId++,
  faction: "",
  team: 1,
  details: "", // New field for army details
});

function GameSetupPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = createSignal(false);
  const [editingArmyId, setEditingArmyId] = createSignal(null);
  const [armyDetailsDraft, setArmyDetailsDraft] = createSignal("");

  const [playAreaWidth, setPlayAreaWidth] = createSignal(44);
  const [playAreaHeight, setPlayAreaHeight] = createSignal(30);
  const [battleName, setBattleName] = createSignal('');

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

  const openArmyDetailsModal = (army) => {
    setEditingArmyId(army.id);
    setArmyDetailsDraft(army.details || "");
    setModalOpen(true);
  };
  const saveArmyDetails = () => {
    updateArmyConfig(editingArmyId(), "details", armyDetailsDraft());
    setModalOpen(false);
  };
  const addArmy = () => {
    if (canAddArmy()) {
      setArmies([...armies(), createNewArmy()]);
    }
  };

  const removeArmy = () => {
    if (canRemoveArmy()) {
      setArmies(armies().slice(0, -1));
    }
  };

  const updateArmyConfig = (id, field, value) => {
    setArmies(prevArmies =>
      prevArmies.map(army =>
        army.id === id ? { ...army, [field]: value } : army
      )
    );
  };

  const handleCreateBattle = async () => {
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
      userId: user.id,
      playerArmy: armies()[0],
      opponentArmy: armies()[1],
      battleName: battleName(),
      battleName: battleName(),
      army_turn: 'TBD',
      player_points: 0,
      opponent_points: 0,
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/battles', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${user.jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameSettings),
      });
  
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Battle created:", data);
      navigate('/battles')
    } catch (error) {
      console.error("Failed to create battle:", error);
      alert("Failed to create battle. See console for details.");
    }
  };

  return (
    <div class={styles.setupContainer}>
      <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              fontFamily: '"Share Tech Mono", "Orbitron", "Audiowide", "Roboto Mono", monospace',
              mr: 2,
              letterSpacing: 2,
              textTransform: "uppercase",
              pb: 2,
              color: 'black'
            }}
          >
            Battle Command AI - Game Setup
          </Typography>

        <fieldset class={styles.fieldset}>
        <legend style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Battle Details</legend>
         <label
          for="battleInput"
          class={styles.nowrapLabel}
          style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}
        >
          Battle Name:
        </label>   
          <input
            id="battleInput"
            type="string"
            value={battleName()}
            onInput={(e) => setBattleName(e.currentTarget.value)}
            class={styles.textInput}
            placeholder="Default Battle"
          />   
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
                <label for={`armyFile-${army.id}`} class={styles.uploadLabel}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => openArmyDetailsModal(army)}
                  style={{ marginTop: "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.5rem" }}
                >
                  {army.details
                    ? <>
                        <CheckCircleIcon sx={{ color: "#43a047", fontSize: "1.2em" }} />
                        Edit Army Details
                      </>
                    : "Add Army Details"}
                </Button>
                </label>
              </div>

              {/* Team Assignment */}
              {/* <div class={styles.inputGroup}>
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
              </div> */}
            </fieldset>
          )}
        </For>
      </fieldset>

      {/* --- Start Game Button --- */}
      <button
        onClick={handleCreateBattle}
        class={styles.actionButton}
        style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#fff", "backgroundColor": "#2e3a59" }}
      >
        Create Battle
      </button>
      <Modal open={modalOpen()} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            minWidth: 350,
            maxWidth: "90vw",
          }}
        >
          <h3>Edit Army Details</h3>
          <textarea
            value={armyDetailsDraft()}
            onInput={e => setArmyDetailsDraft(e.currentTarget.value)}
            rows={8}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "1rem", marginBottom: "1rem" }}
            placeholder="Paste or write army details here, you can get this by exporting your army in the offical 40K app..."
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Button variant="outlined" color="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={saveArmyDetails}>
              Save
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
    
  );
}

export default GameSetupPage;