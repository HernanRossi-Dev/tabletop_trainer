import { createSignal, For, onCleanup, onMount, createEffect, createMemo } from "solid-js";
import styles from "./ActiveBattle.module.css";
import { activeBattle, clearBattle, replaceBattle, updateBattle } from "../store/BattleStore";
import { user  } from "../store/UserStore";
import ChatBubble from "../components/ChatBubble";
import {
    Typography,
} from "@suid/material";

export default function ChatView() {
    const [messages, setMessages] = createSignal([]);
    const [input, setInput] = createSignal("");
    const [recording, setRecording] = createSignal(false);
    let chatViewRef;

    const messageCount = createMemo(() => messages().length);

    // Auto-scroll to bottom when the number of messages changes
    createEffect(() => {
        messageCount(); // depend only on the count
        if (chatViewRef) {
            chatViewRef.scrollTop = chatViewRef.scrollHeight;
        }
    });

    function getNextMessageNumber(battleLog) {
        const keys = Object.keys(battleLog || {});
        if (keys.length === 0) return 1;
        return Math.max(...keys.map(Number)) + 1;
    }

    function updateBattleLog(message, creator) {
        const battleLog = activeBattle.battleLog || {};
        const nextMsgNum = getNextMessageNumber(battleLog);
        const updatedLog = {
            ...battleLog,
            [nextMsgNum]: { message, creator }
        };
        updateBattle({ battleLog: updatedLog });
        console.log("battleLog:", JSON.stringify(battleLog, null, 2));
    }

    const handleSend = () => {
        var text_input = input().trim();
        console.log("Sending message:", text_input);
        if (text_input) {
            setMessages(msgs => [...msgs, { sender: "user", text: text_input }]);
            updateBattleLog(text_input, "user");
            setInput("");
            
            const userId = user.id;
            fetch('http://127.0.0.1:5000/api/interactions/text/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization':  `Bearer ${user.jwt}` },
                body: JSON.stringify({ 'user_id': user.id, "text": text_input, "battle_id": activeBattle.id, "battle_log": JSON.stringify(activeBattle.battleLog, null, 2) })
            })
            .then(response => response.json())
            .then(data => {
                if (data.llm_response) {
                    setMessages(msgs => [
                        ...msgs,
                        { sender: "ai", text: data.llm_response }
                    ]);
                    updateBattleLog(data.llm_response , "agent");
                }
            })
            .catch(err => {
                setMessages(msgs => [
                    ...msgs,
                    { sender: "agent", text: "Error: Could not get response from agent." }
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

