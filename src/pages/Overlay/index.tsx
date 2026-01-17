import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { invoke } from "@tauri-apps/api/core";
import {
    currentMonitor,
    getCurrentWindow,
    Monitor,
} from "@tauri-apps/api/window";
import { debug, error } from "@tauri-apps/plugin-log";
import { CheckIcon, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

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
    NotPressed,
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
        MouseMoveType.NotPressed,
    );
    const monitor = useRef<Monitor | null>(null);
    useEffect(() => {
        currentMonitor()
            .then((m) => {
                monitor.current = m;
            })
            .catch((e) => {
                error(`[OverlayPage] currentMonitor error: ${e}`);
            });
    }, []);

    // closeOverlayPage closes the overlay page
    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);

    // cancelCrop cancels the current crop area
    const cancelCrop = () => {
        setCropArea(null);
        setMouseMoveType(MouseMoveType.NotPressed);
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
        debug(`[OverlayPage] handleMouseDown: ${e.clientX}, ${e.clientY}`);

        const downPoint = { x: e.clientX, y: e.clientY };

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
                const x = e.clientX;
                const y = e.clientY;
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

                const newLeft = e.clientX - startPosition.x;
                const newTop = e.clientY - startPosition.y;
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

    const handleMouseUp = (_: React.MouseEvent) => {
        setMouseMoveType(MouseMoveType.NotPressed);
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
                {cropArea && (
                    <rect
                        x={cropArea.left - 2}
                        y={cropArea.top - 2}
                        width={cropArea.width + 4}
                        height={cropArea.height + 4}
                        stroke="red"
                        strokeWidth="2"
                        fill="none"
                    />
                )}
            </svg>
            {cropArea && mouseMoveType === MouseMoveType.NotPressed && (
                <>
                    <div
                        className="absolute"
                        style={{
                            top: cropArea.top + cropArea.height + 6,
                            left: cropArea.left + cropArea.width,
                            transform: "translateX(-100%)",
                        }}
                    >
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
                                        error(
                                            `[OverlayPage] monitor.current is null`,
                                        );
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
                                        .then(closeOverlayPage)
                                        .catch((e: Error) => {
                                            error(
                                                `[OverlayPage] failed to call screenshots_take: ${e}`,
                                            );
                                        });
                                }}
                            >
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
                </>
            )}
        </div>
    );
}
