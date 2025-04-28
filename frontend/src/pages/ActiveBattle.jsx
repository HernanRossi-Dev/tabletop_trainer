import { createSignal, For } from "solid-js";
import styles from "./ActiveBattle.module.css";

export default function ActiveBattle() {
  const [messages, setMessages] = createSignal([]);
  const [input, setInput] = createSignal("");
  const [recording, setRecording] = createSignal(false);

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
        <h2>Battle Details</h2>
        {/* TODO: Render actual battle details here */}
        <div class={styles.battleDetails}>
          <p>Battle Name: <b>Example Battle</b></p>
          <p>Players: <b>Player 1 vs Player 2</b></p>
          <p>Status: <b>Ongoing</b></p>
          {/* Add more details as needed */}
        </div>
      </div>

      {/* Right: Live Chat */}
      <div class={styles.rightPanel}>
        <h2>AI Assistant</h2>
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