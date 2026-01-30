import { ENABLE_DEBUG_SETTING } from "@/services/setting/const";
import { getSetting } from "@/services/setting/setting";
import { SettingValueBoolean } from "@/services/setting/types";
import { SHORTCUT_SCREENSHOT_EXIT } from "@/services/shortcut/const";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { debug } from "@tauri-apps/plugin-log";
import { useCallback, useEffect, useState } from "react";
import CropArea from "./components/CropArea";
import CropToolbar from "./components/CropToolbar";
import { useCrop } from "./hooks/crop";
import { useMouseEvent } from "./hooks/mouse";
import { useWindowShortcut } from "./hooks/shortcut";
import { MouseMoveType, PenType, ResizeArea } from "./types";
import { useShortcutStore } from "@/stores/useShortcutStore";

export default function OverlayPage() {
    const [enableDebug, setEnableDebug] = useState(false);
    const initShortcuts = useShortcutStore((state) => state.init);

    useEffect(() => {
        getSetting(ENABLE_DEBUG_SETTING).then((setting) => {
            if (!setting) {
                return;
            }
            setEnableDebug((setting.value as SettingValueBoolean).value);
        });
        initShortcuts(false);
    }, []);

    const { isPressing, pressPosition, mousePosition, handleMouseDown, handleMouseUp, handleMouseMove } =
        useMouseEvent();

    const { cropArea, cancelCrop, resizeDirection, mouseMoveType } = useCrop(isPressing, mousePosition, pressPosition);

    const [pen, setPen] = useState(PenType.None);

    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);
    useWindowShortcut(SHORTCUT_SCREENSHOT_EXIT, closeOverlayPage);

    useEffect(() => {
        debug(`[OverlayPage] mouseMoveType: ${mouseMoveType}, resizeDirection: ${resizeDirection}`);
        switch (mouseMoveType) {
            case MouseMoveType.Dragging:
                document.body.style.cursor = "move";
                break;
            case MouseMoveType.Resizing:
                switch (resizeDirection) {
                    case ResizeArea.Top:
                        document.body.style.cursor = "n-resize";
                        break;
                    case ResizeArea.Left:
                        document.body.style.cursor = "w-resize";
                        break;
                    case ResizeArea.Right:
                        document.body.style.cursor = "e-resize";
                        break;
                    case ResizeArea.Bottom:
                        document.body.style.cursor = "s-resize";
                        break;
                    case ResizeArea.TopLeft:
                        document.body.style.cursor = "nw-resize";
                        break;
                    case ResizeArea.TopRight:
                        document.body.style.cursor = "ne-resize";
                        break;
                    case ResizeArea.BottomLeft:
                        document.body.style.cursor = "sw-resize";
                        break;
                    case ResizeArea.BottomRight:
                        document.body.style.cursor = "se-resize";
                        break;
                }
                break;
            default:
                document.body.style.cursor = "default";
                break;
        }
    }, [mouseMoveType, resizeDirection]);

    return (
        <div
            className="fixed top-0 left-0 bg-transparent w-screen h-screen"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <CropArea cropArea={cropArea} />
            {enableDebug && (
                <div
                    className="bg-black flex flex-col w-auto h-auto fixed"
                    style={{
                        top: (mousePosition?.y ?? 0) + 10,
                        left: (mousePosition?.x ?? 0) + 10,
                    }}
                >
                    <span className="text-white">{`Mouse position: ${mousePosition?.x ?? 0}, ${mousePosition?.y ?? 0}`}</span>
                    <span className="text-white">{`Press position: ${pressPosition?.x ?? 0}, ${pressPosition?.y ?? 0}`}</span>
                    <span className="text-white">{`Crop area: left: ${cropArea?.left ?? 0}, top: ${cropArea?.top ?? 0}, width: ${cropArea?.width ?? 0}, height: ${cropArea?.height ?? 0}`}</span>
                    <span className="text-white">{`Resize direction: ${resizeDirection}`}</span>
                    <span className="text-white">{`Mouse move type: ${mouseMoveType}`}</span>
                </div>
            )}
            {cropArea && !isPressing && (
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
                            pen={pen}
                            onConfirm={closeOverlayPage}
                            onCancel={cancelCrop}
                            onSelectPen={(newPen) => {
                                if (pen === newPen) {
                                    setPen(PenType.None);
                                } else {
                                    setPen(newPen);
                                }
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
