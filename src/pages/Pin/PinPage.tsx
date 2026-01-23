import { getCurrentWindow } from "@tauri-apps/api/window";
import { debug } from "@tauri-apps/plugin-log";

export default function PinPage() {
    return (
        <div className="left-0 top-0 w-screen h-screen bg-white">
            <div
                className="fixed top-0 left-0 w-full h-full bg-black z-1"
                data-tauri-drag-region
                onDoubleClick={() => {
                    debug(`[PinPage] double click`);
                    const app = getCurrentWindow();
                    app.close();
                }}
                onWheel={(e: React.WheelEvent) => {
                    debug(`[PinPage] wheel: ${e.deltaY}`);
                }}
            />
        </div>
    );
}
