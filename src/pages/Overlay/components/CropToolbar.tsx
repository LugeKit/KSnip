import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { Monitor, Window } from "@tauri-apps/api/window";
import { debug, error } from "@tauri-apps/plugin-log";
import { CheckIcon, Disc, X } from "lucide-react";
import React from "react";
import { Rectangle } from "../types";

interface CropToolbarProps {
    window: Window;
    cropArea: Rectangle;
    monitor: React.RefObject<Monitor | null>;
    onConfirmSuccess: () => void;
    onCancel: () => void;
}

const CropToolbar: React.FC<CropToolbarProps> = ({
    window,
    cropArea,
    monitor,
    onConfirmSuccess,
    onCancel,
}) => {
    const takeScreenshot = () => {
        if (!monitor.current) {
            error(`[CropToolbar] monitor.current is null`);
            return;
        }
        invoke("screenshots_take", {
            param: {
                left: cropArea.left,
                top: cropArea.top,
                width: cropArea.width,
                height: cropArea.height,
                screenX: monitor.current.position.x,
                screenY: monitor.current.position.y,
            },
        })
            .then(onConfirmSuccess)
            .catch((e: Error) => {
                error(`[CropToolbar] failed to call screenshots_take: ${e}`);
            });
    };

    const takeGif = async () => {
        debug("[CropToolbar] take gif is called");
        try {
            registerGlobalShortcut("Shift+Escape", async () => {
                try {
                    await window.setFocusable(true);
                    await window.setIgnoreCursorEvents(false);
                } catch (e) {
                    error(`[CropToolbar] failed to complete take gif: ${e}`);
                } finally {
                    unregisterGlobalShortcut("Shift+Escape");
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
            <CommonButton onClick={takeGif}>
                <Disc />
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
