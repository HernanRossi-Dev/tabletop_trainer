import { createSignal  } from "solid-js";
import styles from "./ActiveBattle.module.css";
import { activeBattle } from "../store/BattleStore";
import Remove from "@suid/icons-material/Remove";
import Add from "@suid/icons-material/Add";
import {
    Button,
    Typography,
} from "@suid/material";
import ChatView from "./ChatView";

export default function ActiveBattle() {
    const [round, setRound] = createSignal(Number(activeBattle.battleRound) || 1);
    const [playerScore, setplayerScore] = createSignal(Number(activeBattle.playerScore) || 0);
    const [opponentScore, setopponentScore] = createSignal(Number(activeBattle.opponentScore) || 0);


    return (
        <div class={styles.container}>
            <div class={styles.leftPanel}>
                <Typography
                    variant="h3"
                    component="div"
                    sx={{
                        fontWeight: 700,
                        fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace',
                        mr: 2,
                        letterSpacing: 1,
                        pb: 1,
                    }}
                >
                    Battle Name: {activeBattle.battleName}
                </Typography>
                <div class={styles.roundSliderRow}>
                    <Button color="inherit" startIcon={<Remove />} onClick={() => setRound(r => Math.max(1, r - 1))}>
                    </Button>
                    <input
                        type="range"
                        min={1}
                        max={5}
                        value={round()}
                        onInput={e => setRound(Number(e.currentTarget.value))}
                        class={styles.roundSlider}
                        style={{ margin: "0 1rem", flex: 1 }}
                    />
                    <Button color="inherit" startIcon={<Add />} onClick={() => setRound(r => Math.min(5, r + 1))}>
                    </Button>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 700,
                            fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace',
                            letterSpacing: 1,
                        }}
                    >
                        Battle Round: <b>{round()}</b>
                    </Typography>
                </div>
                <div class={styles.battleDetails}>
                    <Typography sx={{fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace'}}>
                        <div class={styles.battleDetails}>
                            <div class={styles.armyBlock}>
                                <span class={styles.armyTitle}>Your Army: <b>{activeBattle.playerArmy.faction}</b></span>
                                <span class={styles.armyDetail}>Detachment: {activeBattle.playerArmy.faction}</span>
                                <span class={styles.armyDetail}>Score: 
                                    <Button color="inherit" sx={{ paddingLeft: 0.5, paddingRight: 0.5, minWidth: 0.05 }} startIcon={<Remove />} onClick={() => setplayerScore(r => Math.max(0, r - 1))}></Button> 
                                    <span class={styles.armyScore}>{playerScore()}</span>
                                    <Button color="inherit" sx={{ paddingLeft: 0.5, paddingRight: 0.5, minWidth: 0.05 }} startIcon={<Add />} onClick={() => setplayerScore(r => Math.min(100, r + 2))}>2</Button> 
                                </span>
                            </div>
                            <div class={styles.armyBlock}>
                                <span class={styles.armyTitle}>Opponent Army: <b>{activeBattle.opponentArmy.faction}</b></span>
                                <span class={styles.armyDetail}>Detachment: {activeBattle.opponentArmy.faction}</span>
                                <span class={styles.armyDetail}>Score: 
                                    <Button sx={{paddingLeft: 1.5, paddingRight: 0.5, minWidth: 0.05 }} color="inherit" startIcon={<Remove />} onClick={() => setopponentScore(r => Math.max(0, r - 1))}></Button> 
                                    <span class={styles.armyScore}>{opponentScore()}</span>
                                    <Button sx={{ paddingLeft: 0.5, paddingRight: 0.5, minWidth: 0.05 }} color="inherit" startIcon={<Add />} onClick={() => setopponentScore(r => Math.min(100, r + 2))}>2</Button> 
                                </span>
                            </div>
                        </div>
                    </Typography>
                </div>
                <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
                    <button
                        class={styles.saveButton}
                        onClick={() => {
                            // TODO: Save logic here (e.g., send round or other changes to backend)
                            alert("Battle state saved!");
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
            <div class={styles.rightPanel}>
               <ChatView></ChatView>
            </div>
        </div>
    );
}

