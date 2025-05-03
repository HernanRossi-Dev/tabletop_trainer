import { createSignal, For } from "solid-js";
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
   
    function getNextMessageNumber(battle_log) {
        const keys = Object.keys(battle_log || {});
        if (keys.length === 0) return 1;
        return Math.max(...keys.map(Number)) + 1;
    }

    function setNextMesage(message) {
        const battle_log = activeBattle.battle_log || {};
        const nextMsgNum = getNextMessageNumber(battle_log);
        const updatedLog = {
            ...battle_log,
            [nextMsgNum]: { message: input(), creator: "user" }
        };
        updateBattle({ battle_log: JSON.stringify(updatedLog) });
    }

    // Placeholder: handle sending a chat message
    const handleSend = () => {
        var text_input = input().trim();
        console.log("Sending message:", text_input);
        const battle_log = activeBattle.battle_log || {};
        if (text_input) {
            setMessages([...messages(), { sender: "user", text: text_input}]);
            setInput("");

            console.log("battle_log:", battle_log);
            if (!battle_log && !Object.keys(battle_log).length > 0) {
                const init_message = `Introduce yourself to the Oppenent, you are the Battle Commander AI. You are an exper Warhammer 40K player. You are commanding the ${activeBattle.opponent_army.faction}`;
                text_input = `${text_input}. ${init_message}` ;
            }
            const userId = user.id;
            fetch('http://127.0.0.1:5000/api/interactions/text/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization':  `Bearer ${user.jwt}` },
                body: JSON.stringify({ user_id, "text": text_input })
            })
            .then(response => response.json())
            .then(data => {
                if (data.llm_response) {
                    setMessages(msgs => [
                        ...msgs,
                        { sender: "ai", text: data.llm_response }
                    ]);
                    setNextMesage(data.llm_response);
                }
            })
            .catch(err => {
                setMessages(msgs => [
                    ...msgs,
                    { sender: "ai", text: "Error: Could not get response from AI." }
                ]);
            });   
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
            <div class={styles.rightPanel}>
                <Typography variant="h4"
                    sx={{
                        fontWeight: 700,
                        fontFamily: '"Share Tech Mono", "Iceland", "Audiowide", "Roboto Mono", monospace',
                        // mr: 2,
                        letterSpacing: 2,
                        mt:-3
                    }}
                >
                    Command AI
                </Typography>
                <div class={styles.chatView}>
                    {/* <For each={messages()}>
                        {msg => (
                            <div class={msg.sender === "user" ? styles.userMsg : styles.aiMsg}>
                                {msg.text}
                            </div>
                        )}
                    </For> */}
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

