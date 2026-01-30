import { ENABLE_DEBUG_SETTING } from "@/services/setting/const";
import { SettingValueBoolean } from "@/services/setting/types";
import { SHORTCUT_SCREENSHOT_EXIT } from "@/services/shortcut/const";
import { useSettingValue } from "@/stores/useSettingStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useState } from "react";
import CropArea from "./components/CropArea";
import CropToolbar from "./components/CropToolbar";
import ResizeHandles from "./components/ResizeHandles";
import { useCrop } from "./hooks/crop";
import { useMouseEvent } from "./hooks/mouse";
import { useWindowShortcut } from "./hooks/shortcut";
import { PenType } from "./types";

export default function OverlayPage() {
    const debugSetting = useSettingValue<SettingValueBoolean>(ENABLE_DEBUG_SETTING);
    const enableDebug = debugSetting?.value ?? false;

    const { mouseState, handleMouseDown, handleMouseUp, handleMouseMove } = useMouseEvent();
    const { cropArea, setMouseType } = useCrop(mouseState);
    const [pen, setPen] = useState(PenType.None);

    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);

    useWindowShortcut(SHORTCUT_SCREENSHOT_EXIT, closeOverlayPage);

    return (
        <div
            className="fixed top-0 left-0 bg-transparent w-screen h-screen"
            onMouseDown={(e) => {
                handleMouseDown(e);
                if (e.target === e.currentTarget) {
                    setMouseType({ type: "cropping" });
                }
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* crop area(the red border line) */}
            <CropArea cropArea={cropArea} />
            {/* resize handles, for mouse dragging and resizing */}
            <ResizeHandles
                cropArea={cropArea}
                onResizeStart={(direction) => setMouseType({ type: "resizing", direction })}
                onDragStart={() => setMouseType({ type: "dragging" })}
            />
            {/* debug panel */}
            {enableDebug && mouseState && (
                <div
                    className="bg-black flex flex-col w-auto h-auto fixed"
                    style={{
                        top: (mouseState.mousePosition?.y ?? 0) + 10,
                        left: (mouseState.mousePosition?.x ?? 0) + 10,
                    }}
                >
                    <span className="text-white">{`Mouse position: ${mouseState.mousePosition?.x ?? 0}, ${mouseState.mousePosition?.y ?? 0}`}</span>
                    <span className="text-white">{`Press position: ${mouseState.pressPosition?.x ?? 0}, ${mouseState.pressPosition?.y ?? 0}`}</span>
                    <span className="text-white">{`Crop area: left: ${cropArea?.left ?? 0}, top: ${cropArea?.top ?? 0}, width: ${cropArea?.width ?? 0}, height: ${cropArea?.height ?? 0}`}</span>
                </div>
            )}
            {/* tool bar */}
            {cropArea && !mouseState.isPressing && (
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
                            onCancel={closeOverlayPage}
                            onSelectPen={(newPen) => {
                                setPen(newPen === pen ? PenType.None : newPen);
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
