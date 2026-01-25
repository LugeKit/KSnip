import { currentMonitor } from "@tauri-apps/api/window";
import { debug } from "@tauri-apps/plugin-log";
import React, { useCallback, useRef, useState } from "react";
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
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(MouseMoveType.NotPressed);
    const startCropArea = useRef<Rectangle | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        debug(`[useCrop] handleMouseDown: ${e.clientX}, ${e.clientY}`);
        setStartPosition({ x: e.clientX, y: e.clientY });
        startCropArea.current = cropArea;
    };

    const handleMouseMove = async (e: React.MouseEvent) => {
        if (!startPosition) {
            const position = { x: e.clientX, y: e.clientY };
            if (isInRectangle(position, cropArea)) {
                setMouseMoveType(MouseMoveType.Dragging);
                return;
            }

            setMouseMoveType(MouseMoveType.Cropping);
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
                const truncatedCropArea = await physicalTruncate({
                    left: Math.min(startPosition.x, x),
                    top: Math.min(startPosition.y, y),
                    width,
                    height,
                });
                setCropArea(truncatedCropArea);
                break;
            }
            case MouseMoveType.Dragging: {
                if (!cropArea || !startCropArea.current) {
                    return;
                }

                const truncatedCropArea = await physicalTruncate({
                    left: startCropArea.current.left + e.clientX - startPosition.x,
                    top: startCropArea.current.top + e.clientY - startPosition.y,
                    width: cropArea.width,
                    height: cropArea.height,
                });
                setCropArea(truncatedCropArea);
                break;
            }
            default:
                return;
        }
    };

    const handleMouseUp = (_: React.MouseEvent) => {
        setMouseMoveType(MouseMoveType.NotPressed);
        setStartPosition(null);
    };

    const cancelCrop = useCallback(() => {
        setCropArea(null);
        setMouseMoveType(MouseMoveType.NotPressed);
        setStartPosition(null);
    }, []);

    return {
        cropArea,
        startPosition,
        mouseMoveType,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        cancelCrop,
    };
}

async function physicalTruncate(cropArea: { left: number; top: number; width: number; height: number }) {
    const monitor = await currentMonitor();
    if (!monitor) {
        return cropArea;
    }

    const scale = monitor.scaleFactor;
    if (scale <= 0) {
        return cropArea;
    }

    return {
        left: Math.round(cropArea.left * scale) / scale,
        top: Math.round(cropArea.top * scale) / scale,
        width: Math.round(cropArea.width * scale) / scale,
        height: Math.round(cropArea.height * scale) / scale,
    };
}
