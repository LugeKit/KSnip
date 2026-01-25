import { currentMonitor } from "@tauri-apps/api/window";
import React, { useEffect, useRef, useState } from "react";
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

export function useMouseEvent() {
    const [isPressing, setIsPressing] = useState(false);
    const [pressPosition, setPressPosition] = useState<Point | null>(null);
    const [mousePosition, setMousePosition] = useState<Point | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPressing(true);
        setPressPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setPressPosition(null);
        setIsPressing(false);
    };

    return {
        isPressing,
        pressPosition,
        mousePosition,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}

export function useCrop(isPressing: boolean, mousePosition: Point | null, pressPosition: Point | null) {
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [resizeDirection, setResizeDirection] = useState<ResizeArea | null>(null);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(MouseMoveType.Cropping);
    const startCropArea = useRef<Rectangle | null>(null);

    const setCropAreaByPhysicalTruncate = async (rectangle: Rectangle) => {
        const truncatedCropArea = await physicalTruncate(rectangle);
        setCropArea(truncatedCropArea);
    };

    useEffect(() => {
        if (isPressing) {
            startCropArea.current = cropArea;
        } else {
        }
    }, [isPressing]);

    useEffect(() => {
        if (!pressPosition) {
            const resizeDirection = closeToEdge(mousePosition, cropArea);
            if (resizeDirection) {
                setMouseMoveType(MouseMoveType.Resizing);
                setResizeDirection(resizeDirection);
                return;
            }

            if (isInRectangle(mousePosition, cropArea)) {
                setMouseMoveType(MouseMoveType.Dragging);
                return;
            }

            setMouseMoveType(MouseMoveType.Cropping);
            return;
        }

        if (!mousePosition) {
            return;
        }

        switch (mouseMoveType) {
            case MouseMoveType.Cropping: {
                const width = Math.abs(pressPosition.x - mousePosition.x);
                const height = Math.abs(pressPosition.y - mousePosition.y);
                if (width <= 0 || height <= 0) {
                    setCropArea(null);
                    return;
                }

                setCropAreaByPhysicalTruncate({
                    left: Math.min(pressPosition.x, mousePosition.x),
                    top: Math.min(pressPosition.y, mousePosition.y),
                    width,
                    height,
                });
                break;
            }
            case MouseMoveType.Dragging: {
                if (!cropArea || !startCropArea.current) {
                    return;
                }

                setCropAreaByPhysicalTruncate({
                    left: startCropArea.current.left + mousePosition.x - pressPosition.x,
                    top: startCropArea.current.top + mousePosition.y - pressPosition.y,
                    width: cropArea.width,
                    height: cropArea.height,
                });
                break;
            }
            default:
                return;
        }
    }, [mousePosition]);

    const cancelCrop = () => {
        setCropArea(null);
    };

    return {
        cropArea,
        cancelCrop,
        resizeDirection,
        mouseMoveType,
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
