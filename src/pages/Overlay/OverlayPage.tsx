import { SHORTCUT_SCREENSHOT_EXIT } from "@/services/shortcut/const";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect } from "react";
import CropArea from "./components/CropArea";
import CropToolbar from "./components/CropToolbar";
import { useCrop } from "./hooks/crop";
import { useWindowShortcut } from "./hooks/shortcut";
import { MouseMoveType } from "./types";

export default function OverlayPage() {
    const {
        cropArea,
        cancelCrop,
        resizeDirection,
        mousePosition,
        startPosition,
        mouseMoveType,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    } = useCrop();

    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);
    useWindowShortcut(SHORTCUT_SCREENSHOT_EXIT, closeOverlayPage);

    useEffect(() => {
        switch (mouseMoveType) {
            case MouseMoveType.Dragging:
                document.body.style.cursor = "move";
                break;
            case MouseMoveType.Resizing:
                document.body.style.cursor = "crosshair";
                break;
            default:
                document.body.style.cursor = "default";
                break;
        }
    }, [mouseMoveType]);

    return (
        <div
            className="fixed top-0 left-0 bg-transparent w-screen h-screen"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <CropArea cropArea={cropArea} />
            <div
                className="bg-black flex flex-col w-auto h-auto fixed"
                style={{
                    top: (mousePosition?.y ?? 0) + 10,
                    left: (mousePosition?.x ?? 0) + 10,
                }}
            >
                <span className="text-white">{`Mouse position: ${mousePosition?.x ?? 0}, ${mousePosition?.y ?? 0}`}</span>
                <span className="text-white">{`Crop area: left: ${cropArea?.left ?? 0}, top: ${cropArea?.top ?? 0}, width: ${cropArea?.width ?? 0}, height: ${cropArea?.height ?? 0}`}</span>
            </div>
            {cropArea && startPosition === null && (
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
