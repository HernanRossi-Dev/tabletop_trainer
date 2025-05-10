import { createSignal, createEffect } from "solid-js";
import "./LiveView.scss";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import SidePanel from "../components/side-panel/SidePanel";
import { Altair } from "../components/altair/Altair";
import ControlTray from "../components/control-tray/ControlTray";
import cn from "classnames";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set VITE_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function LiveView() {
  let videoRef: HTMLVideoElement | undefined;
  const [videoStream, setVideoStream] = createSignal<MediaStream | null>(null);

  // Attach the stream to the video element when it changes
  createEffect(() => {
    if (videoRef && videoStream()) {
      videoRef.srcObject = videoStream();
    }
  });

  return (
    <div class="App">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div class="streaming-console">
          <SidePanel />
          <main>
            <div class="main-app-area">
              {/* APP goes here */}
              <Altair />
              <video
                class={cn("stream", {
                  hidden: !videoRef || !videoStream(),
                })}
                ref={el => (videoRef = el)}
                autoplay
                playsinline
              />
            </div>
            <ControlTray
              videoRef={() => videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={true}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default LiveView;
