import { createSignal, For, createEffect, createMemo, onMount } from "solid-js";
import styles from "./ActiveBattle.module.css";
import { activeBattle, clearBattle, replaceBattle, updateBattle } from "../store/BattleStore";
import { user  } from "../store/UserStore";
import ChatBubble from "../components/ChatBubble";
import { API_HOST } from "../config";
import { loadOngoingBattle } from "../modules/battle-utils";

import {
    Typography,
} from "@suid/material";

export default function ChatView() {
    const [messages, setMessages] = createSignal([]);
    const [input, setInput] = createSignal("");
    const [recording, setRecording] = createSignal(false);
    let chatViewRef;

    const messageCount = createMemo(() => messages().length);

    onMount(() => {
        loadOngoingBattle();
    });

    createEffect(() => {
        messageCount();
        if (chatViewRef) {
            chatViewRef.scrollTop = chatViewRef.scrollHeight;
        }
    });

    function updateBattleLog(updatedBattleLog) {
        console.log("Updated BattleLog:", JSON.stringify(updatedBattleLog, null, 2));
        updateBattle({ battleLog: updatedBattleLog });
    }

    const handleSend = () => {
        var text_input = input().trim();
        console.log("Sending message:", text_input);
        if (text_input) {
            setMessages(msgs => [...msgs, { sender: "user", text: text_input }]);
            setInput("");
            fetch(`${API_HOST}/api/interactions/text/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization':  `Bearer ${user.jwt}` },
                body: JSON.stringify({ 'user_id': user.id, "text": text_input, "battle_id": activeBattle.id })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Received response from ai:", data);
                if (data.battle_log) {
                    const updatedBattleLog = data.battle_log;
                    const keys = Object.keys(updatedBattleLog).map(Number);
                    const lastKey = Math.max(...keys);
                    const lastEntry = updatedBattleLog[lastKey];
                    setMessages(msgs => [
                        ...msgs,
                        { sender: "ai", text: lastEntry.message }
                    ]);
                    updateBattleLog(updatedBattleLog);
                }
            })
            .catch(err => {
                setMessages(msgs => [
                    ...msgs,
                    { sender: "model", text: "Error: Could not get response from agent." }
                ]);
            });   
        }
    };

    // Placeholder: handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // TODO: send file to backend
            setMessages(msgs => [...msgs, { sender: "user", text: `Uploaded file: ${file.name}` }]);
        }
    };

    // Placeholder: handle video upload
    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // TODO: send video to backend
            setMessages(msgs => [...msgs, { sender: "user", text: `Uploaded video: ${file.name}` }]);
        }
    };

    // Placeholder: handle audio recording
    const handleRecordAudio = () => {
        setRecording(!recording());
        // TODO: implement audio recording and send to backend
        if (!recording()) {
            setMessages(msgs => [...msgs, { sender: "user", text: "Audio recording sent." }]);
        }
    };

    return (
        <div class={styles.container}>
            <div class={styles.rightPanel}>
                <Typography variant="h4"
                    sx={{
                        fontWeight: 700,
                        fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace',
                        /* mr: 2, */
                        letterSpacing: 2,
                        mt:-3
                    }}
                >
                    Commander
                </Typography>
                <div
                    class={styles.chatView}
                    ref={el => (chatViewRef = el)}
                >
                    <For each={messages()}>
                        {msg => (
                            <ChatBubble text={msg.text} sender={msg.sender} />
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

