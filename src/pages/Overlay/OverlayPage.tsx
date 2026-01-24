import { SHORTCUT_SCREENSHOT_EXIT } from "@/services/shortcut/const";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback } from "react";
import CropArea from "./components/CropArea";
import CropToolbar from "./components/CropToolbar";
import { useCrop } from "./hooks/crop";
import { useWindowShortcut } from "./hooks/shortcut";
import { MouseMoveType } from "./types";

export default function OverlayPage() {
    const { cropArea, mouseMoveType, handleMouseDown, handleMouseMove, handleMouseUp, cancelCrop } = useCrop();

    // closeOverlayPage closes the overlay page
    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);

    useWindowShortcut(SHORTCUT_SCREENSHOT_EXIT, closeOverlayPage);

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
                        <CropToolbar cropArea={cropArea} onConfirmSuccess={closeOverlayPage} onCancel={cancelCrop} />
                    </div>
                </>
            )}
        </div>
    );
}
