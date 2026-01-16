import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { info } from "@tauri-apps/plugin-log";
import { useState } from "react";
import SelectionOverlay from "./SelectionOverlay";

function App() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCutMe = async () => {
    const startTime = performance.now();

    setIsCapturing(true);
    const appWindow = getCurrentWindow();
    try {
      info(`Start capturing: ${performance.now() - startTime}`)

      const imageData = await invoke<number[]>("capture_screen");
      info(`Capture screen: ${performance.now() - startTime}`)

      const blob = new Blob([new Uint8Array(imageData)], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      info(`Create object URL: ${performance.now() - startTime}`)

      setScreenshot(url);
      info(`Set screenshot: ${performance.now() - startTime}`)

      // Prepare window for selection overlay
      await appWindow.setFullscreen(true);
      await appWindow.setAlwaysOnTop(true);
      await appWindow.setFocus();
    } catch (error) {
      console.error("Failed to capture screen:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleComplete = async () => {
    if (screenshot) {
      URL.revokeObjectURL(screenshot);
    }
    setScreenshot(null);
    const appWindow = getCurrentWindow();
    await appWindow.setFullscreen(false);
    await appWindow.setAlwaysOnTop(false);
  };

  const handleCancel = async () => {
    if (screenshot) {
      URL.revokeObjectURL(screenshot);
    }
    setScreenshot(null);
    const appWindow = getCurrentWindow();
    await appWindow.setFullscreen(false);
    await appWindow.setAlwaysOnTop(false);
  };

  return (
    <main className="m-0 h-screen flex flex-col justify-center items-center text-center bg-gray-100">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">ksnip</h1>
        <p className="text-gray-600">Simple Screen Capture Tool</p>
        <button
          onClick={handleCutMe}
          disabled={isCapturing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isCapturing ? "Capturing..." : "Cut Me!"}
        </button>
      </div>
      {screenshot && (
        <SelectionOverlay
          screenshot={screenshot}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </main>
  );
}

export default App;
