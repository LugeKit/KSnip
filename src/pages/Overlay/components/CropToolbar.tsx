import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import {
    SHORTCUT_CREATE_PIN,
    SHORTCUT_RECORD_REGION,
    SHORTCUT_RECORD_REGION_CONFIRM,
    SHORTCUT_SCREENSHOT_CONFIRM,
} from "@/services/shortcut/const";
import { getShortcut, registerWindowShortcut } from "@/services/shortcut/shortcut";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow, Monitor } from "@tauri-apps/api/window";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { CheckIcon, Disc, PinIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Rectangle } from "../types";

interface CropToolbarProps {
    cropArea: Rectangle;
    monitor: React.RefObject<Monitor | null>;
    onConfirmSuccess: () => void;
    onCancel: () => void;
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
    return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        screenX: monitor.position.x,
        screenY: monitor.position.y,
    };
}

export default function CropToolbar({ cropArea, monitor, onConfirmSuccess, onCancel }: CropToolbarProps) {
    const [isRecording, setRecording] = useState(false);

    const takeScreenshot = async () => {
        if (!monitor.current) {
            error(`[CropToolbar] monitor.current is null`);
            return;
        }
        try {
            await invoke("screenshot_take", {
                param: newLogicalParam(cropArea, monitor.current),
            });
            onConfirmSuccess();
        } catch (e) {
            error(`[CropToolbar] failed to call screenshots_take: ${e}`);
        }
    };

    const createPin = async () => {
        if (!monitor.current) {
            error(`[CropToolbar] monitor.current is null`);
            return;
        }
        try {
            const param = newLogicalParam(cropArea, monitor.current);
            const pin_id: number = await invoke("pin_create", {
                param,
            });
            newPinPage(param, pin_id);
            onConfirmSuccess();
        } catch (e) {
            error(`[CropToolbar] failed to call pin_create: ${e}`);
        }
    };

    const recordRegion = async () => {
        debug("[CropToolbar] record region is called");
        if (isRecording || !monitor.current) {
            return;
        }

        try {
            const confirmShortcut = await getShortcut(SHORTCUT_RECORD_REGION_CONFIRM);
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
                    onConfirmSuccess();
                }
            });
            await window.setFocusable(false);
            await window.setIgnoreCursorEvents(true);
            setRecording(true);
            await invoke("record_start", {
                param: newLogicalParam(cropArea, monitor.current),
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

function useWindowShortcut(id: string, callback: (e: KeyboardEvent) => void) {
    useEffect(() => {
        const registerShortcut = async () => {
            return await registerWindowShortcut(id, callback);
        };
        const clear = registerShortcut();
        return () => {
            clear.then((clear) => clear());
        };
    }, [id, callback]);
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
