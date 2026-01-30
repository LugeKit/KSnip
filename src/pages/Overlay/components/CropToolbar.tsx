import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { CheckIcon, Disc, PinIcon, RectangleCircle, X } from "lucide-react";
import React, { useState } from "react";
import { useWindowShortcut } from "../hooks/shortcut";
import { PenType, Rectangle } from "../types";

interface CropToolbarProps {
    cropArea: Rectangle;
    pen: PenType;
    onConfirm: () => void;
    onCancel: () => void;
    onSelectPen: (pen: PenType) => void;
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

export default function CropToolbar({ cropArea, pen, onConfirm, onCancel, onSelectPen }: CropToolbarProps) {
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

    return (
        <ButtonGroup
            onMouseDown={(e: React.MouseEvent) => {
                e.stopPropagation();
            }}
        >
            <CommonButton onClick={takeScreenshot}>
                <CheckIcon />
            </CommonButton>
            <CommonButton onClick={() => onSelectPen(PenType.Rectangle)}>
                {pen === PenType.Rectangle ? <RectangleCircle className="text-red-500" /> : <RectangleCircle />}
            </CommonButton>
            <CommonButton onClick={createPin}>
                <PinIcon />
            </CommonButton>
            <CommonButton onClick={recordRegion}>
                {isRecording ? <Disc className="text-red-500" /> : <Disc />}
            </CommonButton>
            <CommonButton onClick={onCancel}>
                <X />
            </CommonButton>
        </ButtonGroup>
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
