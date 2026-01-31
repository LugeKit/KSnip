import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import {
    SHORTCUT_CREATE_PIN,
    SHORTCUT_RECORD_REGION,
    SHORTCUT_RECORD_REGION_CONFIRM,
    SHORTCUT_SCREENSHOT_CONFIRM,
} from "@/services/shortcut/const";
import { useShortcutStore } from "@/stores/useShortcutStore";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor, getCurrentWindow, Monitor } from "@tauri-apps/api/window";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { CheckIcon, Minus, Pen as Pencil, Pin, RectangleHorizontal, Video, X } from "lucide-react";
import React, { useState } from "react";
import { useWindowShortcut } from "../hooks/shortcut";
import { Pen, Rectangle } from "../types";

interface CropToolbarProps {
    cropArea: Rectangle;
    pen: Pen;
    onConfirm: () => void;
    onCancel: () => void;
    onSelectPen: (pen: Pen) => void;
    onPenUpdate?: (pen: Pen) => void;
}

interface LogicalParam {
    left: number;
    top: number;
    width: number;
    height: number;
    screenX: number;
    screenY: number;
}

function newLogicalParam(rect: Rectangle, monitor: Monitor): LogicalParam {
    debug(`[newLogicalParam] rect: ${JSON.stringify(rect)}, monitor: ${JSON.stringify(monitor)}`);
    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        screenX: monitor.position.x,
        screenY: monitor.position.y,
    };
}

export default function CropToolbar({
    cropArea,
    pen,
    onConfirm,
    onCancel,
    onSelectPen,
    onPenUpdate,
}: CropToolbarProps) {
    const [isRecording, setRecording] = useState(false);

    const takeScreenshot = async () => {
        const monitor = await currentMonitor();
        if (!monitor) {
            error(`[CropToolbar] failed to get current monitor`);
            return;
        }
        invoke("screenshot_take", {
            param: newLogicalParam(cropArea, monitor),
        }).catch((e) => {
            error(`[CropToolbar] failed to call screenshots_take: ${e}`);
        });
        onConfirm();
    };

    const createPin = async () => {
        const monitor = await currentMonitor();

        if (!monitor) {
            error(`[CropToolbar] monitor.current is null`);
            return;
        }

        try {
            const param = newLogicalParam(cropArea, monitor);
            const pin_id: number = await invoke("pin_create", {
                param,
            });
            newPinPage(param, pin_id);
            onConfirm();
        } catch (e) {
            error(`[CropToolbar] failed to call pin_create: ${e}`);
        }
    };

    const recordRegion = async () => {
        const monitor = await currentMonitor();

        if (isRecording || !monitor) {
            return;
        }

        try {
            const confirmShortcut = useShortcutStore.getState().shortcuts[SHORTCUT_RECORD_REGION_CONFIRM];
            if (!confirmShortcut) {
                error(`[CropToolbar] failed to get confirm shortcut`);
                return;
            }

            const window = getCurrentWindow();
            registerGlobalShortcut(confirmShortcut.keys, async () => {
                try {
                    await Promise.all([
                        invoke("record_stop"),
                        window.setFocusable(true),
                        window.setIgnoreCursorEvents(false),
                        unregisterGlobalShortcut(confirmShortcut.keys),
                    ]);
                } catch (e) {
                    error(`[CropToolbar] failed to complete take gif: ${e}`);
                } finally {
                    setRecording(false);
                    onConfirm();
                }
            });
            await window.setFocusable(false);
            await window.setIgnoreCursorEvents(true);
            setRecording(true);
            await invoke("record_start", {
                param: newLogicalParam(cropArea, monitor),
            });
        } catch (e) {
            error(`[CropToolbar] failed to take gif: ${e}`);
        }
    };

    useWindowShortcut(SHORTCUT_SCREENSHOT_CONFIRM, takeScreenshot);
    useWindowShortcut(SHORTCUT_CREATE_PIN, createPin);
    useWindowShortcut(SHORTCUT_RECORD_REGION, recordRegion);

    const handlePenUpdate = (updatedPen: Pen) => {
        if (onPenUpdate) {
            onPenUpdate(updatedPen);
        } else {
            onSelectPen(updatedPen);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            <ButtonGroup
                onMouseDown={(e: React.MouseEvent) => {
                    e.stopPropagation();
                }}
            >
                <CommonButton onClick={takeScreenshot}>
                    <CheckIcon />
                </CommonButton>
                <CommonButton
                    onClick={() => onSelectPen({ type: "rectangle", strokeColor: "#EF4444", strokeWidth: 2 })}
                >
                    <RectangleHorizontal className={pen.type === "rectangle" ? "text-red-500" : ""} />
                </CommonButton>
                <CommonButton
                    onClick={() => onSelectPen({ type: "free_line", strokeColor: "#EF4444", strokeWidth: 2 })}
                >
                    <Pencil className={pen.type === "free_line" ? "text-red-500" : ""} />
                </CommonButton>
                <CommonButton
                    onClick={() => onSelectPen({ type: "straight_line", strokeColor: "#EF4444", strokeWidth: 2 })}
                >
                    <Minus className={pen.type === "straight_line" ? "text-red-500" : ""} />
                </CommonButton>
                <CommonButton onClick={createPin}>
                    <Pin />
                </CommonButton>
                <CommonButton onClick={recordRegion}>
                    <Video className={isRecording ? "text-red-500" : ""} />
                </CommonButton>
                <CommonButton onClick={onCancel}>
                    <X />
                </CommonButton>
            </ButtonGroup>
            {pen.type !== "none" && <PenSettings pen={pen} onChange={handlePenUpdate} />}
        </div>
    );
}

function PenSettings({ pen, onChange }: { pen: Pen; onChange: (pen: Pen) => void }) {
    if (pen.type === "none") return null;

    const colors = [
        "#EF4444", // Red
        "#EAB308", // Yellow
        "#22C55E", // Green
        "#3B82F6", // Blue
        "#000000", // Black
        "#FFFFFF", // White
    ];

    const updateColor = (color: string) => {
        onChange({ ...pen, strokeColor: color });
    };

    const updateWidth = (width: number) => {
        onChange({ ...pen, strokeWidth: width });
    };

    return (
        <div
            className="flex flex-col gap-2 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="flex flex-wrap gap-1.5 items-center">
                {colors.map((c) => (
                    <button
                        key={c}
                        className={`w-5 h-5 rounded-full border border-gray-200 ${
                            pen.strokeColor === c ? "ring-2 ring-offset-1 ring-blue-500" : ""
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => updateColor(c)}
                    />
                ))}
                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200">
                    <input
                        type="color"
                        value={pen.strokeColor}
                        onChange={(e) => updateColor(e.target.value)}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={pen.strokeWidth}
                    onChange={(e) => updateWidth(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <Input
                    type="number"
                    min="1"
                    max="20"
                    value={pen.strokeWidth}
                    onChange={(e) => updateWidth(Number(e.target.value))}
                    className="w-10 h-6 px-1 text-center text-xs"
                />
            </div>
        </div>
    );
}

function CommonButton(props: React.ComponentProps<typeof Button>) {
    return <Button variant="outline" size="icon-sm" {...props} />;
}

function newPinPage(param: LogicalParam, pinID: number) {
    if (pinID <= 0) {
        throw new Error(`pinID must be greater than 0`);
    }

    const pinPage = new WebviewWindow(`pin_page_${pinID}`, {
        url: `#pin?id=${pinID}`,
        width: param.width,
        height: param.height,
        x: param.left,
        y: param.top,
        transparent: true,
        decorations: false,
        alwaysOnTop: true,
        resizable: false,
        shadow: false,
    });

    pinPage.once("tauri://created", () => {
        info("pin page created");
    });

    pinPage.once("tauri://error", () => {
        error("failed to create pin page");
    });
}
