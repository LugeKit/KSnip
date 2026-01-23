import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { Monitor, Window } from "@tauri-apps/api/window";
import { debug, error } from "@tauri-apps/plugin-log";
import { CheckIcon, Disc, PinIcon, X } from "lucide-react";
import React, { useState } from "react";
import { Rectangle } from "../types";

interface CropToolbarProps {
    window: Window;
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

const CropToolbar: React.FC<CropToolbarProps> = ({ window, cropArea, monitor, onConfirmSuccess, onCancel }) => {
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
            invoke("pin_create", {
                param: newLogicalParam(cropArea, monitor.current),
            });
            onConfirmSuccess();
        } catch (e) {
            error(`[CropToolbar] failed to call pin_create: ${e}`);
        }
    };

    const recordRegion = async () => {
        debug("[CropToolbar] record region is called");
        setRecording(true);
        try {
            registerGlobalShortcut(["Shift", "Escape"], async () => {
                try {
                    await window.setFocusable(true);
                    await window.setIgnoreCursorEvents(false);
                } catch (e) {
                    error(`[CropToolbar] failed to complete take gif: ${e}`);
                } finally {
                    unregisterGlobalShortcut(["Shift", "Escape"]);
                    setRecording(false);
                }
            });
            await window.setFocusable(false);
            await window.setIgnoreCursorEvents(true);
        } catch (e) {
            error(`[CropToolbar] failed to take gif: ${e}`);
        }
    };

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
};

function CommonButton(props: React.ComponentProps<typeof Button>) {
    return <Button variant="outline" size="icon-sm" {...props} />;
}

export default CropToolbar;
