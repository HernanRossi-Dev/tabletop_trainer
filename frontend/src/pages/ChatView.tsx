import { createSignal, For, onCleanup, Show } from "solid-js";
import styles from "./ActiveBattle.module.css";
import { activeBattle, updateBattle } from "../store/BattleStore"; // Assuming clearBattle, replaceBattle might not be used directly here
import { user } from "../store/UserStore";
import ChatBubble from "../components/ChatBubble";
import { Typography } from "@suid/material";

// 1. Import the LiveApi class
// Ensure gemini-live-api.js is an ES module or adapt the import
// You might need to add 'export' to the class in gemini-live-api.js
// e.g., `export class LiveApi { ... }`
import { LiveApi, LiveApiResponse } from '../lib/gemini-live-api'; // Adjust path as needed

// --- Configuration (replace with your actual values or from env/store) ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const GEMINI_LIVE_ENDPOINT = import.meta.env.VITE_GEMINI_LIVE_ENDPOINT || "YOUR_GEMINI_LIVE_API_ENDPOINT"; // e.g., 'wss://live.api.gemini.com/v1/chat' (check docs)

export default function ChatView() {
    const [messages, setMessages] = createSignal<{ sender: string; text: string }[]>([]);
    const [textInput, setTextInput] = createSignal(""); // Renamed from 'input' to avoid conflict

    // --- Video Chat State ---
    const [isStreaming, setIsStreaming] = createSignal(false);
    const [localStream, setLocalStream] = createSignal<MediaStream | null>(null);
    const [isConnecting, setIsConnecting] = createSignal(false); // For UI feedback
    const [videoError, setVideoError] = createSignal<string | null>(null);

    let localVideoRef: HTMLVideoElement | undefined;
    let liveApiClient: LiveApi | null = null;
    let audioContext: AudioContext | null = null; // For playing back audio from API

    // Helper to get battle log (minor change from original)
    function getNextMessageNumber(currentLog: Record<string, any>) {
        const keys = Object.keys(currentLog || {});
        if (keys.length === 0) return 1;
        return Math.max(...keys.map(Number)) + 1;
    }

    function addMessageToBattleLog(messageContent: string, creator: "user" | "ai") {
        const currentLog = activeBattle.battleLog ? JSON.parse(activeBattle.battle_log) : {};
        const nextMsgNum = getNextMessageNumber(currentLog);
        const updatedLog = {
            ...currentLog,
            [nextMsgNum]: { message: messageContent, creator }
        };
        updateBattle({ battleLog: JSON.stringify(updatedLog) });
    }


    // --- Gemini Live API Callbacks ---
    const handleApiResponse = (response: LiveApiResponse) => {
        console.log("Live API Response:", response);
        setIsConnecting(false); // No longer just connecting if we get a response

        if (response.error) {
            console.error("Live API Error:", response.error.message);
            setMessages(msgs => [...msgs, { sender: "ai", text: `Error: ${response.error.message}` }]);
            setVideoError(`API Error: ${response.error.message}`);
            // Potentially stop streaming on critical errors
            return;
        }

        // Assuming the response structure from your gemini-live-api.js
        // The demo plays audio directly. Text might be part of a 'chat_message' or similar.
        if (response.results && response.results.length > 0) {
            const result = response.results[0]; // Process first result, adapt if multiple

            // Check for text content (e.g., transcription or AI message)
            // The structure of 'result' depends on what your Gemini Live API endpoint returns
            // For example, it might be result.alternatives[0].transcript for speech-to-text
            // Or a specific field for AI chat responses.
            let aiTextResponse = "";
            if (result.alternatives && result.alternatives.length > 0 && result.alternatives[0].transcript) {
                // This is likely the user's transcribed speech
                // You might choose to display this differently or not at all if the AI also speaks
                console.log("User transcription:", result.alternatives[0].transcript);
                // If you want to show user's speech as a message:
                // setMessages(msgs => [...msgs, { sender: "user", text: `(Spoken): ${result.alternatives[0].transcript}` }]);
            }

            // Look for AI's direct text response (this part is speculative based on Gemini models)
            // The Live API might provide this in a different field or structure.
            // For now, we assume any text response from AI comes here.
            // You'll need to adjust based on actual API output for multimodal chat.
            if (response.llm_response) { // If the wrapper `LiveApiResponse` has this
                 aiTextResponse = response.llm_response as string;
            } else if (typeof result === 'string') { // Or if result itself is a string
                 aiTextResponse = result;
            }
            // Add more checks based on the actual structure of `result` for AI text

            if (aiTextResponse) {
                setMessages(msgs => [...msgs, { sender: "ai", text: aiTextResponse }]);
                addMessageToBattleLog(aiTextResponse, "ai");
            }
        }

        // Handle audio playback (using the play method from gemini-live-api.js)
        if (response.audio_content && liveApiClient) {
             console.log("Playing AI audio content");
             liveApiClient.play(response.audio_content); // Assumes LiveApi has a play method
        }
    };

    const handleApiError = (error: Error) => {
        console.error("Live API Client Error:", error);
        setMessages(msgs => [...msgs, { sender: "ai", text: `Stream Error: ${error.message}` }]);
        setIsConnecting(false);
        setIsStreaming(false);
        setVideoError(`Stream Error: ${error.message}`);
    };

    const handleApiComplete = () => {
        console.log("Live API Stream Completed by server.");
        setIsConnecting(false);
        // Don't necessarily stop streaming on client side unless intended
        // setIsStreaming(false);
    };


    // --- Video Chat Actions ---
    const startVideoChat = async () => {
        if (isStreaming()) return;
        setVideoError(null);
        setIsConnecting(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef) {
                localVideoRef.srcObject = stream;
            }

            if (!audioContext) {
                 audioContext = new AudioContext();
            }

            // Initialize LiveApi client
            liveApiClient = new LiveApi(
                GEMINI_API_KEY,
                GEMINI_LIVE_ENDPOINT,
                audioContext, // Pass the audio context
                handleApiResponse,
                handleApiError,
                handleApiComplete
            );

            // Prepare the initial prompt/context for the AI
            // This might include the persona and game context.
            const initialPrompt = `You are the Battle Commander AI for the ${activeBattle.opponent_army.faction}. You are an expert Warhammer 40K player. Engage in a spoken conversation.`;

            // Start streaming to Gemini Live API
            // The `start` method in `gemini-live-api.js` likely takes the stream.
            // It might also take an initial prompt or configuration.
            await liveApiClient.start(stream, {
                // You might need to pass additional config here based on gemini-live-api.js
                // For example, initial prompt or specific model parameters
                // model: "gemini-1.5-flash-multimodal", // Example, check Gemini docs for Live API models
                prompt: initialPrompt,
                // languageCode: 'en-US', // etc.
            });

            setIsStreaming(true);
            setIsConnecting(false);
            setMessages(msgs => [...msgs, { sender: "system", text: "Video chat started. You can speak now." }]);

        } catch (err) {
            console.error("Error starting video chat:", err);
            setVideoError(`Error starting video: ${err.message}`);
            setMessages(msgs => [...msgs, { sender: "system", text: `Could not start video: ${err.message}` }]);
            setIsConnecting(false);
            setIsStreaming(false);
        }
    };

    const stopVideoChat = () => {
        if (!isStreaming() && !isConnecting()) return;

        liveApiClient?.stop(); // Tell the API client to stop sending
        liveApiClient = null;

        localStream()?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        if (localVideoRef) {
            localVideoRef.srcObject = null;
        }

        setIsStreaming(false);
        setIsConnecting(false);
        setMessages(msgs => [...msgs, { sender: "system", text: "Video chat stopped." }]);
    };

    // Cleanup on component unmount
    onCleanup(() => {
        stopVideoChat();
        audioContext?.close();
    });

    // --- Text Chat (can still be used when video is off, or for system messages) ---
    const handleSendText = () => {
        const text = textInput().trim();
        if (text) {
            // User text message
            setMessages(msgs => [...msgs, { sender: "user", text }]);
            addMessageToBattleLog(text, "user");
            setTextInput("");

            // If video is not active, send text to your existing backend
            if (!isStreaming()) {
                console.log("Sending text message to backend:", text);
                const userId = user.id; // Assuming user.id is available
                fetch('http://127.0.0.1:5000/api/interactions/text/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.jwt}` },
                    body: JSON.stringify({ "user_id": userId, "text": text, "battle_log_json": activeBattle.battle_log /* send current log */ })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.llm_response) {
                        setMessages(msgs => [
                            ...msgs,
                            { sender: "ai", text: data.llm_response }
                        ]);
                        addMessageToBattleLog(data.llm_response, "ai");
                    }
                })
                .catch(err => {
                    console.error("Error sending text to backend:", err);
                    setMessages(msgs => [
                        ...msgs,
                        { sender: "ai", text: "Error: Could not get text response from AI." }
                    ]);
                });
            } else {
                // If video is active, user "sending text" might mean they typed something
                // while the AI is expected to respond via voice/video.
                // How to handle this? Maybe send it as a special message to the Live API?
                // For now, we'll assume text input is primarily for when video is off.
                // Or, the text input could be a way to send a system prompt to the Live API.
                // liveApiClient?.sendTextMessage(text); // If your LiveApi wrapper supports this
                console.warn("Text input while video streaming is active. Behavior TBD.");
            }
        }
    };


    return (
        <div class={styles.container}>
            <div class={styles.rightPanel}>
                <Typography variant="h4" /* ... */ >
                    Command AI
                </Typography>

                {/* Video Area */}
                <div class={styles.videoArea}>
                    <video ref={localVideoRef} class={styles.localVideo} autoplay muted playsinline />
                    {/* No remote video for AI unless the API explicitly provides a video stream of an avatar */}
                    {/* <video ref={remoteVideoRef} class={styles.remoteVideo} autoplay playsinline /> */}
                    <Show when={videoError()}>
                        <p class={styles.errorMessage}>{videoError()}</p>
                    </Show>
                </div>
                <div class={styles.videoControls}>
                    <button
                        onClick={isStreaming() ? stopVideoChat : startVideoChat}
                        disabled={isConnecting()}
                        class={styles.videoButton}
                    >
                        {isConnecting() ? "Connecting..." : (isStreaming() ? "Stop Video Chat" : "Start Video Chat")}
                    </button>
                </div>


                <div class={styles.chatView}>
                    <For each={messages()}>
                        {msg => <ChatBubble text={msg.text} sender={msg.sender} />}
                    </For>
                </div>

                {/* Text input is less primary if video chat is the focus */}
                <Show when={!isStreaming()}> {/* Optionally hide text input when streaming */}
                    <div class={styles.chatInputRow}>
                        <input
                            class={styles.chatInput}
                            value={textInput()}
                            onInput={e => setTextInput(e.currentTarget.value)}
                            onKeyDown={e => e.key === "Enter" && handleSendText()}
                            placeholder="Type your message (or use video chat)..."
                        />
                        <button class={styles.sendButton} onClick={handleSendText}>Send Text</button>
                    </div>
                </Show>

                {/* Keep existing upload buttons if they are still relevant, or remove/repurpose */}
                <div class={styles.uploadRow} style={{ "margin-top": "10px", "opacity": isStreaming() ? 0.5 : 1, "pointer-events": isStreaming() ? "none" : "auto" }}>
                    {/* ... your existing upload buttons ... (they probably won't work well with live video) */}
                    <p><i>File/Audio uploads might be disabled during video chat.</i></p>
                </div>
            </div>
        </div>
    );
}