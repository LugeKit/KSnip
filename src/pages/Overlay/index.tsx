import { getCurrentWindow } from "@tauri-apps/api/window";
import { error, info } from "@tauri-apps/plugin-log";

export default function OverlayPage() {
  info(`[OverlayPage] OverlayPage loaded`);
  const appWindow = getCurrentWindow();

  return (
    <div className="flex justify-center items-center bg-transparent w-screen h-screen">
      <button
        className="bg-blue-300 w-100 h-10 text-black"
        onClick={(_) => {
          info(`[OverlayPage] button clicked`);
          appWindow.close().catch((e) => {
            error(`[OverlayPage] close error: ${e}`);
          });
        }}
      >
        click me again
      </button>
    </div>
  );
}
