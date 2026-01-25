import { currentMonitor } from "@tauri-apps/api/window";
import { debug } from "@tauri-apps/plugin-log";
import React, { useCallback, useRef, useState } from "react";
import { MouseMoveType, Point, Rectangle, ResizeArea } from "../types";

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

const EDGE_CORNER_RADIUS = 10;
const EDGE_DISTANCE = 10;

function distance(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function closeToEdge(point: Point | null, rectangle: Rectangle | null) {
    if (!point || !rectangle) {
        return null;
    }

    if (distance(point, { x: rectangle.left, y: rectangle.top }) <= EDGE_CORNER_RADIUS) {
        return ResizeArea.TopLeft;
    }

    if (distance(point, { x: rectangle.left + rectangle.width, y: rectangle.top }) <= EDGE_CORNER_RADIUS) {
        return ResizeArea.TopRight;
    }

    if (distance(point, { x: rectangle.left, y: rectangle.top + rectangle.height }) <= EDGE_CORNER_RADIUS) {
        return ResizeArea.BottomLeft;
    }

    if (
        distance(point, { x: rectangle.left + rectangle.width, y: rectangle.top + rectangle.height }) <=
        EDGE_CORNER_RADIUS
    ) {
        return ResizeArea.BottomRight;
    }

    if (
        point.x >= rectangle.left &&
        point.x <= rectangle.left + rectangle.width &&
        Math.abs(point.y - rectangle.top) <= EDGE_DISTANCE
    ) {
        return ResizeArea.Top;
    }

    if (
        point.x >= rectangle.left &&
        point.x <= rectangle.left + rectangle.width &&
        Math.abs(point.y - rectangle.top - rectangle.height) <= EDGE_DISTANCE
    ) {
        return ResizeArea.Bottom;
    }

    if (
        point.y >= rectangle.top &&
        point.y <= rectangle.top + rectangle.height &&
        Math.abs(point.x - rectangle.left) <= EDGE_DISTANCE
    ) {
        return ResizeArea.Left;
    }

    if (
        point.y >= rectangle.top &&
        point.y <= rectangle.top + rectangle.height &&
        Math.abs(point.x - rectangle.left - rectangle.width) <= EDGE_DISTANCE
    ) {
        return ResizeArea.Right;
    }

    return null;
}

export function useCrop() {
    const [startPosition, setStartPosition] = useState<Point | null>(null);
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [resizeDirection, setResizeDirection] = useState<ResizeArea | null>(null);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(MouseMoveType.NotPressed);
    const [mousePosition, setMousePosition] = useState<Point | null>(null);
    const startCropArea = useRef<Rectangle | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        debug(`[useCrop] handleMouseDown: ${e.clientX}, ${e.clientY}`);
        setStartPosition({ x: e.clientX, y: e.clientY });
        startCropArea.current = cropArea;
    };

    const handleMouseMove = async (e: React.MouseEvent) => {
        const position = { x: e.clientX, y: e.clientY };
        setMousePosition(position);

        if (!startPosition) {
            const resizeDirection = closeToEdge(position, cropArea);
            if (resizeDirection) {
                setMouseMoveType(MouseMoveType.Resizing);
                setResizeDirection(resizeDirection);
                return;
            }

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
        cancelCrop,
        resizeDirection,
        mousePosition,
        startPosition,
        mouseMoveType,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
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
