import { currentMonitor } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
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

const EDGE_CORNER_RADIUS = 5;
const EDGE_DISTANCE = 5;

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

export function useCrop(isPressing: boolean, mousePosition: Point | null, pressPosition: Point | null) {
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [resizeDirection, setResizeDirection] = useState<ResizeArea | null>(null);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(MouseMoveType.Cropping);
    const startCropArea = useRef<Rectangle | null>(null);

    const setCropAreaByPhysicalTruncate = async (rectangle: Rectangle) => {
        const truncatedCropArea = await physicalTruncate(rectangle);
        setCropArea(truncatedCropArea);
    };

    const determineMoveType = (mousePosition: Point | null) => {
        const resizeDirection = closeToEdge(mousePosition, cropArea);
        if (resizeDirection !== null) {
            setMouseMoveType(MouseMoveType.Resizing);
            setResizeDirection(resizeDirection);
            return;
        } else {
            setResizeDirection(null);
        }

        if (isInRectangle(mousePosition, cropArea)) {
            setMouseMoveType(MouseMoveType.Dragging);
            return;
        }

        setMouseMoveType(MouseMoveType.Cropping);
        return;
    };

    const makingMouseMoveByType = (mousePosition: Point, pressPosition: Point) => {
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
    };

    useEffect(() => {
        if (isPressing) {
            startCropArea.current = cropArea;
        }
    }, [isPressing]);

    useEffect(() => {
        if (!isPressing) {
            determineMoveType(mousePosition);
            return;
        }

        if (!mousePosition || !pressPosition) {
            return;
        }
        makingMouseMoveByType(mousePosition, pressPosition);
    }, [isPressing, mousePosition, pressPosition]);

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
