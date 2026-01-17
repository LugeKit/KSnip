import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { info } from "@tauri-apps/plugin-log";
import { CheckIcon, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface Point {
    x: number;
    y: number;
}

interface Rectangle {
    left: number;
    top: number;
    width: number;
    height: number;
}

enum MouseMoveType {
    Ignore,
    Cropping,
    Dragging,
}

function isInRectangle(point: Point | null, rectangle: Rectangle | null) {
    if (!point || !rectangle) {
        return false;
    }

    return (
        point.x >= rectangle.left &&
        point.x <= rectangle.left + rectangle.width &&
        point.y >= rectangle.top &&
        point.y <= rectangle.top + rectangle.height
    );
}

export default function OverlayPage() {
    const [startPosition, setStartPosition] = useState<Point | null>(null);
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(
        MouseMoveType.Ignore,
    );

    // closeOverlayPage closes the overlay page
    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);

    // cancelCrop cancels the current crop area
    const cancelCrop = () => {
        setCropArea(null);
        setMouseMoveType(MouseMoveType.Ignore);
        setStartPosition(null);
    };

    // register global keydown event listener to close overlay page
    // 1. no crop area: press "Esc" to close the overlay page
    // 2. crop area: press "Esc" to cancel the crop
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (cropArea) {
                    cancelCrop();
                    return;
                }
                closeOverlayPage();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [closeOverlayPage, cropArea]);

    const handleMouseDown = (e: React.MouseEvent) => {
        info(`[OverlayPage] handleMouseDown: ${e.clientX}, ${e.clientY}`);

        const downPoint = { x: e.screenX, y: e.screenY };

        // dragging the crop area
        if (cropArea && isInRectangle(downPoint, cropArea)) {
            setMouseMoveType(MouseMoveType.Dragging);
            setStartPosition({
                x: downPoint.x - cropArea.left,
                y: downPoint.y - cropArea.top,
            });
            return;
        }

        // start a new crop area
        setMouseMoveType(MouseMoveType.Cropping);
        setStartPosition(downPoint);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!startPosition) {
            return;
        }

        switch (mouseMoveType) {
            case MouseMoveType.Cropping: {
                const x = e.screenX;
                const y = e.screenY;
                const width = Math.abs(startPosition.x - x);
                const height = Math.abs(startPosition.y - y);
                if (width <= 0 || height <= 0) {
                    setCropArea(null);
                    return;
                }
                setCropArea({
                    left: Math.min(startPosition.x, x),
                    top: Math.min(startPosition.y, y),
                    width,
                    height,
                });
                break;
            }
            case MouseMoveType.Dragging: {
                if (!cropArea) {
                    return;
                }

                const newLeft = e.screenX - startPosition.x;
                const newTop = e.screenY - startPosition.y;
                setCropArea({
                    left: newLeft,
                    top: newTop,
                    width: cropArea.width,
                    height: cropArea.height,
                });
                break;
            }
            default:
                return;
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        info(`[OverlayPage] handleMouseUp: ${e.clientX}, ${e.clientY}`);
        setMouseMoveType(MouseMoveType.Ignore);
    };

    return (
        <div
            className="fixed bg-transparent w-screen h-screen"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="crop-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {cropArea && (
                            <rect
                                x={cropArea.left}
                                y={cropArea.top}
                                width={cropArea.width}
                                height={cropArea.height}
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(31, 41, 55, 0.7)"
                    mask="url(#crop-mask)"
                />
            </svg>
            {cropArea && (
                <>
                    <div
                        className="absolute border-2 border-red-500 bg-transparent"
                        style={{ ...cropArea }}
                    />
                    {mouseMoveType === MouseMoveType.Ignore && (
                        <div
                            className="absolute"
                            style={{
                                top: cropArea.top + cropArea.height + 2,
                                left: cropArea.left,
                            }}
                        >
                            <ButtonGroup
                                onMouseDown={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                }}
                            >
                                <Button variant="outline" size="icon-sm">
                                    <CheckIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={() => {
                                        cancelCrop();
                                    }}
                                >
                                    <X />
                                </Button>
                            </ButtonGroup>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
