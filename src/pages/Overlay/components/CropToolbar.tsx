import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { RECORDING_PATH_SETTING } from "@/services/setting/const";
import { SettingValuePath } from "@/services/setting/types";
import {
    SHORTCUT_CREATE_PIN,
    SHORTCUT_RECORD_REGION,
    SHORTCUT_RECORD_REGION_CONFIRM,
    SHORTCUT_SCREENSHOT_CONFIRM,
    SHORTCUT_SCREENSHOT_EXIT,
    SHORTCUT_TOOL_ARROW,
    SHORTCUT_TOOL_LINE,
    SHORTCUT_TOOL_PEN,
    SHORTCUT_TOOL_RECTANGLE,
    SHORTCUT_TOOL_SEQUENCE,
    SHORTCUT_TOOL_TEXT,
} from "@/services/shortcut/const";
import { Shortcut } from "@/services/shortcut/types";
import { useSettingValue } from "@/stores/useSettingStore";
import { useShortcutStore } from "@/stores/useShortcutStore";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor, getCurrentWindow, Monitor } from "@tauri-apps/api/window";
import { debug, error, info } from "@tauri-apps/plugin-log";
import {
    CheckIcon,
    ListOrdered,
    MoveUpRight,
    Pen as Pencil,
    Pin,
    RectangleHorizontal,
    Slash,
    Text,
    Video,
    X,
} from "lucide-react";
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
    const recordingPathSetting = useSettingValue<SettingValuePath>(RECORDING_PATH_SETTING);

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

    const confirmRegionRecordShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_RECORD_REGION_CONFIRM));
    const recordRegion = async () => {
        const monitor = await currentMonitor();

        if (isRecording || !monitor) {
            return;
        }

        try {
            if (!confirmRegionRecordShortcut) {
                error(`[CropToolbar] failed to get confirm shortcut`);
                return;
            }

            const window = getCurrentWindow();
            registerGlobalShortcut(confirmRegionRecordShortcut.keys, async () => {
                try {
                    await Promise.all([
                        invoke("record_stop"),
                        window.setFocusable(true),
                        window.setIgnoreCursorEvents(false),
                        unregisterGlobalShortcut(confirmRegionRecordShortcut.keys),
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
            onSelectPen({ type: "none" });
            setRecording(true);
            await invoke("record_start", {
                param: newLogicalParam(cropArea, monitor),
                savePath: recordingPathSetting?.path,
            });
        } catch (e) {
            error(`[CropToolbar] failed to take gif: ${e}`);
        }
    };

    const rectanglePen: Pen = { type: "rectangle", color: "#EF4444", strokeWidth: 2 };
    const arrowPen: Pen = { type: "arrow", color: "#EF4444", strokeWidth: 2 };
    const straightLinePen: Pen = { type: "straight_line", color: "#EF4444", strokeWidth: 2 };
    const freeLinePen: Pen = { type: "free_line", color: "#EF4444", strokeWidth: 2 };
    const sequencePen: Pen = { type: "sequence", color: "#EF4444", strokeWidth: 2, size: 24 };
    const textPen: Pen = { type: "text" };
    useWindowShortcut(SHORTCUT_SCREENSHOT_CONFIRM, takeScreenshot);
    useWindowShortcut(SHORTCUT_CREATE_PIN, createPin);
    useWindowShortcut(SHORTCUT_RECORD_REGION, recordRegion);
    useWindowShortcut(SHORTCUT_TOOL_RECTANGLE, () => {
        onSelectPen(rectanglePen);
    });
    useWindowShortcut(SHORTCUT_TOOL_ARROW, () => {
        onSelectPen(arrowPen);
    });
    useWindowShortcut(SHORTCUT_TOOL_LINE, () => {
        onSelectPen(straightLinePen);
    });
    useWindowShortcut(SHORTCUT_TOOL_PEN, () => {
        onSelectPen(freeLinePen);
    });
    useWindowShortcut(SHORTCUT_TOOL_SEQUENCE, () => {
        onSelectPen(sequencePen);
    });
    useWindowShortcut(SHORTCUT_TOOL_TEXT, () => {
        onSelectPen(textPen);
    });

    const screenshotConfirmShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_SCREENSHOT_CONFIRM));
    const createPinShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_CREATE_PIN));
    const recordRegionShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_RECORD_REGION));
    const exitShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_SCREENSHOT_EXIT));
    const toolTextShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_TOOL_TEXT));
    const toolRectangleShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_TOOL_RECTANGLE));
    const toolArrowShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_TOOL_ARROW));
    const toolLineShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_TOOL_LINE));
    const toolPenShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_TOOL_PEN));
    const toolSequenceShortcut = useShortcutStore((store) => store.getShortcut(SHORTCUT_TOOL_SEQUENCE));

    const getTooltips = (text: string, shortcut?: Shortcut) => {
        if (shortcut && shortcut.keys && shortcut.keys.length > 0) {
            return `${text} (${shortcut.keys.join(" + ")})`;
        }
        return text;
    };

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
                <CommonButton onClick={takeScreenshot} tooltips={[getTooltips("完成截图", screenshotConfirmShortcut)]}>
                    <CheckIcon />
                </CommonButton>
                <CommonButton
                    selected={pen.type === "text"}
                    onClick={() => onSelectPen(textPen)}
                    tooltips={[getTooltips("文字工具", toolTextShortcut)]}
                >
                    <Text />
                </CommonButton>
                <CommonButton
                    selected={pen.type === "rectangle"}
                    onClick={() => onSelectPen(rectanglePen)}
                    tooltips={[getTooltips("矩形工具", toolRectangleShortcut)]}
                >
                    <RectangleHorizontal />
                </CommonButton>
                <CommonButton
                    selected={pen.type === "arrow"}
                    onClick={() => onSelectPen(arrowPen)}
                    tooltips={[getTooltips("箭头工具", toolArrowShortcut)]}
                >
                    <MoveUpRight />
                </CommonButton>
                <CommonButton
                    selected={pen.type === "straight_line"}
                    onClick={() => onSelectPen(straightLinePen)}
                    tooltips={[getTooltips("直线工具", toolLineShortcut)]}
                >
                    <Slash />
                </CommonButton>
                <CommonButton
                    selected={pen.type === "free_line"}
                    onClick={() => onSelectPen(freeLinePen)}
                    tooltips={[getTooltips("画笔工具", toolPenShortcut)]}
                >
                    <Pencil />
                </CommonButton>
                <CommonButton
                    selected={pen.type === "sequence"}
                    onClick={() => onSelectPen(sequencePen)}
                    tooltips={[getTooltips("序号工具", toolSequenceShortcut)]}
                >
                    <ListOrdered />
                </CommonButton>
                <CommonButton onClick={createPin} tooltips={[getTooltips("贴图", createPinShortcut)]}>
                    <Pin style={{ transform: "rotate(45deg)" }} />
                </CommonButton>
                <CommonButton
                    selected={isRecording}
                    onClick={recordRegion}
                    tooltips={[
                        getTooltips("区域录制", recordRegionShortcut),
                        getTooltips("完成录制", confirmRegionRecordShortcut),
                    ]}
                >
                    <Video />
                </CommonButton>
                <CommonButton onClick={onCancel} tooltips={[getTooltips("取消", exitShortcut)]}>
                    <X />
                </CommonButton>
            </ButtonGroup>
            {pen.type !== "none" && <PenSettings pen={pen} onChange={handlePenUpdate} />}
        </div>
    );
}

function PenSettings({ pen, onChange }: { pen: Pen; onChange: (pen: Pen) => void }) {
    if (pen.type === "none" || pen.type === "text") return null;

    const colors = [
        "#EF4444", // Red
        "#EAB308", // Yellow
        "#22C55E", // Green
        "#3B82F6", // Blue
        "#000000", // Black
        "#FFFFFF", // White
    ];

    const updateColor = (color: string) => {
        onChange({ ...pen, color: color });
    };

    const updateWidth = (width: number) => {
        onChange({ ...pen, strokeWidth: width });
    };

    const updateSize = (size: number) => {
        if (pen.type === "sequence") {
            onChange({ ...pen, size: size });
        }
    };

    return (
        <div
            className="flex flex-col gap-2 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="flex flex-wrap gap-2 items-center">
                {colors.map((c) => (
                    <button
                        key={c}
                        className={`w-5 h-5 rounded-full shadow-sm ${
                            pen.color === c ? "ring-2 ring-offset-1 ring-blue-500" : ""
                        } ${pen.color !== c ? "hover:ring-2 hover:ring-offset-1 hover:ring-blue-300" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => updateColor(c)}
                    />
                ))}
                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                <div className="relative w-5 h-5 rounded-full overflow-hidden">
                    <input
                        type="color"
                        value={pen.color}
                        onChange={(e) => updateColor(e.target.value)}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                    />
                </div>
            </div>
            {
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
            }
            {pen.type === "sequence" && (
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={pen.type === "sequence" ? pen.size : 0}
                        onChange={(e) => updateSize(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <Input
                        type="number"
                        min="10"
                        max="100"
                        value={pen.type === "sequence" ? pen.size : 0}
                        onChange={(e) => updateSize(Number(e.target.value))}
                        className="w-10 h-6 px-1 text-center text-xs"
                    />
                </div>
            )}
        </div>
    );
}

function CommonButton({
    tooltips,
    selected,
    ...props
}: React.ComponentProps<typeof Button> & { selected?: boolean; tooltips?: string[] }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon-sm"
                    className={selected ? "text-red-500 bg-muted hover:text-red-500" : ""}
                    {...props}
                />
            </TooltipTrigger>
            {tooltips && (
                <TooltipContent side={"bottom"}>
                    {tooltips.map((tooltip) => {
                        return <p>{tooltip}</p>;
                    })}
                </TooltipContent>
            )}
        </Tooltip>
    );
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
