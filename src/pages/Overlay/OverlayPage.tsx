import { ENABLE_DEBUG_SETTING } from "@/services/setting/const";
import { SettingValueBoolean } from "@/services/setting/types";
import { SHORTCUT_REDO, SHORTCUT_SCREENSHOT_EXIT, SHORTCUT_UNDO } from "@/services/shortcut/const";
import { useSettingValue } from "@/stores/useSettingStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";
import CropArea from "./components/CropArea";
import CropToolbar from "./components/CropToolbar";
import PenHandles from "./components/PenHandles";
import ResizeHandles from "./components/ResizeHandles";
import { useCrop } from "./hooks/crop";
import { useShapeHistory } from "./hooks/history";
import { useMouseEvent } from "./hooks/mouse";
import { useWindowShortcut } from "./hooks/shortcut";
import { Pen } from "./types";

export default function OverlayPage() {
    const debugSetting = useSettingValue<SettingValueBoolean>(ENABLE_DEBUG_SETTING);
    const enableDebug = debugSetting?.value ?? false;

    const { mouseState, handleMouseDown, handleMouseUp, handleMouseMove } = useMouseEvent();
    const { cropArea, mouseMoveType, setMouseMoveType } = useCrop(mouseState);

    const [pen, setPen] = useState<Pen>({ type: "none" });

    const { shapes, addShape, undo, redo } = useShapeHistory();
    useWindowShortcut(SHORTCUT_UNDO, undo);
    useWindowShortcut(SHORTCUT_REDO, redo);

    useEffect(() => {
        if (pen.type === "none") {
            setMouseMoveType({ type: "idle" });
            return;
        }

        setMouseMoveType({ type: "painting" });
    }, [pen]);

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
                    setMouseMoveType({ type: "cropping" });
                }
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* crop area(the red border line) */}
            <CropArea cropArea={cropArea} />

            {/* resize handles, for mouse dragging and resizing */}
            {cropArea &&
                (mouseMoveType.type === "idle" ||
                    mouseMoveType.type === "resizing" ||
                    mouseMoveType.type === "dragging") && (
                    <ResizeHandles
                        cropArea={cropArea}
                        onResizeStart={(direction) => setMouseMoveType({ type: "resizing", direction })}
                        onDragStart={() => setMouseMoveType({ type: "dragging" })}
                    />
                )}

            {/* pen handles, for painting */}
            {cropArea && (
                <PenHandles
                    cropArea={cropArea}
                    mouseState={mouseState}
                    pen={pen}
                    shapes={shapes}
                    onAddShape={addShape}
                />
            )}

            {/* debug panel */}
            {enableDebug && mouseState && (
                <div
                    className="bg-black flex flex-col w-auto h-auto fixed p-2 rounded-md"
                    style={{
                        top: (mouseState.mousePosition?.y ?? 0) + 15,
                        left: (mouseState.mousePosition?.x ?? 0) + 15,
                    }}
                >
                    <span className="text-white">{`Mouse move type: ${mouseMoveType.type}`}</span>
                    <span className="text-white">{`Pen: ${JSON.stringify(pen)}`}</span>
                    <span className="text-white">{`Mouse position: ${mouseState.mousePosition?.x ?? 0}, ${mouseState.mousePosition?.y ?? 0}`}</span>
                    <span className="text-white">{`Press position: ${mouseState.pressPosition?.x ?? 0}, ${mouseState.pressPosition?.y ?? 0}`}</span>
                    <span className="text-white">{`Crop area: left: ${cropArea?.left ?? 0}, top: ${cropArea?.top ?? 0}, width: ${cropArea?.width ?? 0}, height: ${cropArea?.height ?? 0}`}</span>
                </div>
            )}

            {/* tool bar */}
            {cropArea &&
                !(
                    mouseMoveType.type === "cropping" ||
                    mouseMoveType.type === "dragging" ||
                    mouseMoveType.type === "resizing"
                ) && (
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
                                    setPen(newPen.type === pen.type ? { type: "none" } : newPen);
                                }}
                                onPenUpdate={setPen}
                            />
                        </div>
                    </>
                )}
        </div>
    );
}
