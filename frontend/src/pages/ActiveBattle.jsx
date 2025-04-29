import { createSignal, For } from "solid-js";
import styles from "./ActiveBattle.module.css";
import { activeBattle, clearBattle, replaceBattle } from "../store/battle_store";
import { parseBattle } from '../types/battle_type';
import { Typography } from "@suid/material";

export default function ActiveBattle() {
    const [messages, setMessages] = createSignal([]);
    const [input, setInput] = createSignal("");
    const [recording, setRecording] = createSignal(false);
    const parsed_battle = parseBattle(activeBattle);
    const [round, setRound] = createSignal(Number(parsed_battle.battle_round) || 1);
    console.log(`ActiveBattle: ${JSON.stringify(activeBattle)}`);
    // Placeholder: handle sending a chat message
    const handleSend = () => {
        if (input().trim()) {
            setMessages([...messages(), { sender: "user", text: input() }]);
            setInput("");
            // TODO: send to backend and handle AI response
        }
    };

    // Placeholder: handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // TODO: send file to backend
            setMessages([...messages(), { sender: "user", text: `Uploaded file: ${file.name}` }]);
        }
    };

    // Placeholder: handle video upload
    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // TODO: send video to backend
            setMessages([...messages(), { sender: "user", text: `Uploaded video: ${file.name}` }]);
        }
    };

    // Placeholder: handle audio recording
    const handleRecordAudio = () => {
        setRecording(!recording());
        // TODO: implement audio recording and send to backend
        if (!recording()) {
            setMessages([...messages(), { sender: "user", text: "Audio recording sent." }]);
        }
    };

    return (
        <div class={styles.container}>
            {/* Left: Battle Details */}
            <div class={styles.leftPanel}>
                <Typography variant="h4"
                    component="div"
                    sx={{
                        fontWeight: 700,
                        fontFamily: '"Share Tech Mono", "Orbitron", "Audiowide", "Roboto Mono", monospace',
                        mr: 2,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                    }}
                >
                    Battle Details
                </Typography>
                {/* TODO: Render actual battle details here */}
                <div class={styles.battleDetails}>
                    <p>Battle Name: <b>{parsed_battle.battle_name}</b></p>
                    <p>Your Army: <b>{parsed_battle.player_army.faction}</b></p>
                    <p>Opponent Army: <b>{parsed_battle.opponent_army.faction}</b></p>

                    {/* Add more details as needed */}
                </div>
                <div class={styles.roundSliderRow}>
                    <button
                        class={styles.roundButton}
                        onClick={() => setRound(r => Math.max(1, r - 1))}
                        aria-label="Previous Round"
                    >−</button>
                    <input
                        type="range"
                        min={1}
                        max={5}
                        value={round()}
                        onInput={e => setRound(Number(e.currentTarget.value))}
                        class={styles.roundSlider}
                        style={{ margin: "0 1rem", flex: 1 }}
                    />
                    <button
                        class={styles.roundButton}
                        onClick={() => setRound(r => Math.min(10, r + 1))}
                        aria-label="Next Round"
                    >+</button>
                    <span class={styles.roundLabel}>Round: <b>{round()}</b></span>
                </div>
            </div>

            {/* Right: Live Chat */}
            <div class={styles.rightPanel}>
                <Typography variant="h4"
                    component="div"
                    sx={{
                        fontWeight: 700,
                        fontFamily: '"Share Tech Mono", "Orbitron", "Audiowide", "Roboto Mono", monospace',
                        mr: 2,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                    }}
                >
                    Commander AI
                </Typography>
                <div class={styles.chatView}>
                    <For each={messages()}>
                        {msg => (
                            <div class={msg.sender === "user" ? styles.userMsg : styles.aiMsg}>
                                {msg.text}
                            </div>
                        )}
                    </For>
                </div>
                <div class={styles.chatInputRow}>
                    <input
                        class={styles.chatInput}
                        value={input()}
                        onInput={e => setInput(e.currentTarget.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Type your message..."
                    />
                    <button class={styles.sendButton} onClick={handleSend}>Send</button>
                </div>
                <div class={styles.uploadRow}>
                    <label class={styles.uploadButton}>
                        Upload File
                        <input type="file" style={{ display: "none" }} onChange={handleFileUpload} />
                    </label>
                    <label class={styles.uploadButton}>
                        Upload Video
                        <input type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
                    </label>
                    <button class={styles.recordButton} onClick={handleRecordAudio}>
                        {recording() ? "Stop Recording" : "Record Audio"}
                    </button>
                </div>
            </div>
        </div>
    );
}

