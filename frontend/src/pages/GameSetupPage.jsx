import { createSignal, For } from 'solid-js';
import { WARHAMMER_40K_FACTIONS } from '../config/factions';
import {createBattle} from '../modules/Api';
import styles from './GameSetupPage.module.css';
import { user } from '../store/UserStore';
import {
  Typography,
} from "@suid/material";
import Modal from "@suid/material/Modal";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import CheckCircleIcon from "@suid/icons-material/CheckCircle";
import { useNavigate } from "@solidjs/router";
import { parseArmyList } from "../modules/ArmyListParser";

let nextArmyId = 0;
const createNewArmy = (team) => ({
  id: nextArmyId++,
  faction: "",
  team,
  details: "",
});

function GameSetupPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = createSignal(false);
  const [armyDetailsDraft, setArmyDetailsDraft] = createSignal("");

  const [playAreaWidth, setPlayAreaWidth] = createSignal(60);
  const [playAreaHeight, setPlayAreaHeight] = createSignal(44);
  const [battleName, setBattleName] = createSignal('');

  const [playerArmy, setPlayerArmy] = createSignal(createNewArmy(1));
  const [opponentArmy, setOpponentArmy] = createSignal(createNewArmy(2));


  const openArmyDetailsModal = (army, setArmy) => {
    setArmyDetailsDraft(army.details || "");
    setModalOpen(true);
    GameSetupPage._setArmyDetails = setArmy;
  };

  const saveArmyDetails = () => {
    const parsedArmyDetails = parseArmyList(armyDetailsDraft());
    console.log("Parsed Army Details:", parsedArmyDetails);
    GameSetupPage._setArmyDetails(army => ({ ...army, details: parsedArmyDetails }));
    setModalOpen(false);
  };

  const updateArmyConfig = (setArmy, field, value) => {
    setArmy(army => ({ ...army, [field]: value }));
  };

  const handleCreateBattle = async () => {
    if (!playerArmy().faction || !opponentArmy().faction) {
      alert("Please select a faction for both armies.");
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
      playerArmy: playerArmy(),
      opponentArmy: opponentArmy(),
      battleName: battleName(),
      armyTurn: 'TBD',
      playerScore: 0,
      opponentScore: 0,
      battleLog: "",
    };
    try {
      const gameData = await createBattle(gameSettings);
      if (gameData) {
        console.log("Battle created:", gameData);
        navigate('/battles')
      }
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
          <label for="heightInput" style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Length:</label>
          <input
            id="heightInput"
            type="number"
            min="1"
            value={playAreaHeight()}
            onInput={(e) => setPlayAreaHeight(parseInt(e.currentTarget.value, 10) || 0)}
            class={styles.numberInput}
          />
          <label for="widthInput" style={{ "fontFamily": "Orbitron, Arial, sans-serif", "color": "#4a5a8a" }}>Width:</label>
          <input
            id="widthInput"
            type="number"
            min="1"
            value={playAreaWidth()}
            onInput={(e) => setPlayAreaWidth(parseInt(e.currentTarget.value, 10) || 0)}
            class={styles.numberInput}
          />
        </div>
      </fieldset>

      {/* --- Armies Section --- */}
      <fieldset class={styles.fieldset}>
        <legend style={{ fontFamily: "Orbitron, Arial, sans-serif", color: "#4a5a8a" }}>
          Armies
        </legend>

        {/* Player Army */}
        <fieldset class={styles.armyConfig}>
          <legend style={{ fontFamily: "Orbitron, Arial, sans-serif", color: "#4a5a8a" }}>
            Army 1 (Player)
          </legend>
          <div class={styles.inputGroup}>
            <label for="factionSelect-player" style={{ fontFamily: "Orbitron, Arial, sans-serif", color: "#4a5a8a" }}>
              Faction:
            </label>
            <select
              id="factionSelect-player"
              value={playerArmy().faction}
              onChange={e => updateArmyConfig(setPlayerArmy, 'faction', e.currentTarget.value)}
              class={styles.selectInput}
              required
            >
              <option value="" disabled>-- Select Faction --</option>
              <For each={WARHAMMER_40K_FACTIONS}>
                {factionName => <option value={factionName}>{factionName}</option>}
              </For>
            </select>
            <label for="armyFile-player" class={styles.uploadLabel}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => openArmyDetailsModal(playerArmy(), setPlayerArmy)}
                style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {playerArmy().details
                  ? <>
                    <CheckCircleIcon sx={{ color: "#43a047", fontSize: "1.2em" }} />
                    Edit Army Details
                  </>
                  : "Add Army Details"}
              </Button>
            </label>
          </div>
          <Typography sx={{ fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace', textAlign: "center"}}>
            <div class={styles.battleDetails}>
              <div class={styles.armyBlock}>
                <span class={styles.armyTitle}>Army Name: {playerArmy().details.armyName}<br/></span>
                <span class={styles.armyDetail}>Detachment: {playerArmy().details.detachment}<br/></span>
                <span class={styles.armyDetail}>Size: {playerArmy().details.armySizePoints}</span>
              </div>
            </div>
          </Typography>
        </fieldset>

        {/* Opponent Army */}
        <fieldset class={styles.armyConfig}>
          <legend style={{ fontFamily: "Orbitron, Arial, sans-serif", color: "#4a5a8a" }}>
            Army 2 (Opponent)
          </legend>
          <div class={styles.inputGroup}>
            <label for="factionSelect-opponent" style={{ fontFamily: "Orbitron, Arial, sans-serif", color: "#4a5a8a" }}>
              Faction:
            </label>
            <select
              id="factionSelect-opponent"
              value={opponentArmy().faction}
              onChange={e => updateArmyConfig(setOpponentArmy, 'faction', e.currentTarget.value)}
              class={styles.selectInput}
              required
            >
              <option value="" disabled>-- Select Faction --</option>
              <For each={WARHAMMER_40K_FACTIONS}>
                {factionName => <option value={factionName}>{factionName}</option>}
              </For>
            </select>
            <label for="armyFile-opponent" class={styles.uploadLabel}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => openArmyDetailsModal(opponentArmy(), setOpponentArmy)}
                style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {opponentArmy().details
                  ? <>
                    <CheckCircleIcon sx={{ color: "#43a047", fontSize: "1.2em" }} />
                    Edit Army Details
                  </>
                  : "Add Army Details"}
              </Button>
            </label>
          </div>
          <Typography sx={{ fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace', textAlign: "center"}}>
            <div class={styles.battleDetails}>
              <div class={styles.armyBlock}>
                <span class={styles.armyTitle}>Army Name: {opponentArmy().details.armyName}<br/></span>
                <span class={styles.armyDetail}>Detachment: {opponentArmy().details.detachment}<br/></span>
                <span class={styles.armyDetail}>Size: {opponentArmy().details.armySizePoints}</span>
              </div>
            </div>
          </Typography>
        </fieldset>
      </fieldset>

      {/* --- Start Game Button --- */}
      <button
        onClick={handleCreateBattle}
        class={styles.actionButton}
        style={{ fontFamily: "Orbitron, Arial, sans-serif", color: "#fff", backgroundColor: "#2e3a59" }}
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