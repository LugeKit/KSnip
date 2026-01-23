import { currentMonitor, getCurrentWindow, Monitor } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useWindowShortcut } from "../../hooks/shortcut";
import CropArea from "./components/CropArea";
import CropToolbar from "./components/CropToolbar";
import { useCrop } from "./hooks/crop";
import { MouseMoveType } from "./types";

export default function OverlayPage() {
    const { cropArea, mouseMoveType, handleMouseDown, handleMouseMove, handleMouseUp, cancelCrop } = useCrop();

    const monitor = useRef<Monitor | null>(null);
    useEffect(() => {
        currentMonitor()
            .then((m) => {
                monitor.current = m;
            })
            .catch((e) => {
                error(`[OverlayPage] currentMonitor error: ${e}`);
            });
    }, []);

    // closeOverlayPage closes the overlay page
    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);

    // register global keydown event listener to close overlay page
    // 1. no crop area: press "Esc" to close the overlay page
    // 2. crop area: press "Esc" to cancel the crop
    useWindowShortcut(
        useMemo(() => ["Escape"], []),
        () => {
            if (mouseMoveType !== MouseMoveType.NotPressed || cropArea) {
                cancelCrop();
                return;
            }
            closeOverlayPage();
        },
    );

    return (
        <div
            className="fixed top-0 left-0 bg-transparent w-screen h-screen"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <CropArea cropArea={cropArea} />
            {cropArea && mouseMoveType === MouseMoveType.NotPressed && (
                <>
                    <div
                        className="absolute"
                        style={{
                            top: cropArea.top + cropArea.height + 6,
                            left: cropArea.left + cropArea.width,
                            transform: "translateX(-100%)",
                        }}
                    >
                        <CropToolbar
                            cropArea={cropArea}
                            monitor={monitor}
                            onConfirmSuccess={closeOverlayPage}
                            onCancel={cancelCrop}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
