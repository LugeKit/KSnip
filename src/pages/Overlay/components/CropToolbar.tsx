import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { invoke } from "@tauri-apps/api/core";
import { Monitor } from "@tauri-apps/api/window";
import { error } from "@tauri-apps/plugin-log";
import { CheckIcon, X } from "lucide-react";
import React from "react";
import { Rectangle } from "../types";

interface CropToolbarProps {
    cropArea: Rectangle;
    monitor: React.RefObject<Monitor | null>;
    onConfirmSuccess: () => void;
    onCancel: () => void;
}

const CropToolbar: React.FC<CropToolbarProps> = ({
    cropArea,
    monitor,
    onConfirmSuccess,
    onCancel,
}) => {
    return (
        <ButtonGroup
            onMouseDown={(e: React.MouseEvent) => {
                e.stopPropagation();
            }}
        >
            <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                    if (!monitor.current) {
                        error(`[OverlayPage] monitor.current is null`);
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
                            error(
                                `[OverlayPage] failed to call screenshots_take: ${e}`,
                            );
                        });
                }}
            >
                <CheckIcon />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={onCancel}>
                <X />
            </Button>
        </ButtonGroup>
    );
};

export default CropToolbar;
