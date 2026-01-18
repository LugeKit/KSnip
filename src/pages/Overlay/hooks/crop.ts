import { debug } from "@tauri-apps/plugin-log";
import React, { useState } from "react";
import { MouseMoveType, Point, Rectangle } from "../types";

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

export function useCrop() {
    const [startPosition, setStartPosition] = useState<Point | null>(null);
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(
        MouseMoveType.NotPressed,
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        debug(`[useCrop] handleMouseDown: ${e.clientX}, ${e.clientY}`);

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

    const cancelCrop = () => {
        setCropArea(null);
        setMouseMoveType(MouseMoveType.NotPressed);
        setStartPosition(null);
    };

    return {
        cropArea,
        mouseMoveType,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        cancelCrop,
    };
}
