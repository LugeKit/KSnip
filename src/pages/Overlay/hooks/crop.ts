import { currentMonitor } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { MouseMoveType, Point, Rectangle, ResizeArea } from "../types";

export function useCrop(isPressing: boolean, mousePosition: Point | null, pressPosition: Point | null) {
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [resizeDirection, setResizeDirection] = useState<ResizeArea>(ResizeArea.None);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>(MouseMoveType.Cropping);
    const startCropArea = useRef<Rectangle | null>(null);

    const setCropAreaByPhysicalTruncate = async (rectangle: Rectangle) => {
        const truncatedCropArea = await physicalTruncate(rectangle);
        setCropArea(truncatedCropArea);
    };

    const startResize = (direction: ResizeArea) => {
        setResizeDirection(direction);
        setMouseMoveType(MouseMoveType.Resizing);
    };

    const startDrag = () => {
        setMouseMoveType(MouseMoveType.Dragging);
    };

    const startCrop = () => {
        setMouseMoveType(MouseMoveType.Cropping);
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
            case MouseMoveType.Resizing: {
                if (!cropArea || !resizeDirection || !startCropArea.current) {
                    return;
                }

                const xDiff = mousePosition.x - pressPosition.x;
                const yDiff = mousePosition.y - pressPosition.y;

                switch (resizeDirection) {
                    case ResizeArea.TopLeft: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left + xDiff,
                            top: startCropArea.current.top + yDiff,
                            width: startCropArea.current.width - xDiff,
                            height: startCropArea.current.height - yDiff,
                        });
                        break;
                    }
                    case ResizeArea.Top: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left,
                            top: startCropArea.current.top + yDiff,
                            width: startCropArea.current.width,
                            height: startCropArea.current.height - yDiff,
                        });
                        break;
                    }
                    case ResizeArea.TopRight: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left,
                            top: startCropArea.current.top + yDiff,
                            width: startCropArea.current.width + xDiff,
                            height: startCropArea.current.height - yDiff,
                        });
                        break;
                    }
                    case ResizeArea.Left: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left + xDiff,
                            top: startCropArea.current.top,
                            width: startCropArea.current.width - xDiff,
                            height: startCropArea.current.height,
                        });
                        break;
                    }
                    case ResizeArea.Right: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left,
                            top: startCropArea.current.top,
                            width: startCropArea.current.width + xDiff,
                            height: startCropArea.current.height,
                        });
                        break;
                    }
                    case ResizeArea.BottomLeft: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left + xDiff,
                            top: startCropArea.current.top,
                            width: startCropArea.current.width - xDiff,
                            height: startCropArea.current.height + yDiff,
                        });
                        break;
                    }
                    case ResizeArea.Bottom: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left,
                            top: startCropArea.current.top,
                            width: startCropArea.current.width,
                            height: startCropArea.current.height + yDiff,
                        });
                        break;
                    }
                    case ResizeArea.BottomRight: {
                        setCropAreaByPhysicalTruncate({
                            left: startCropArea.current.left,
                            top: startCropArea.current.top,
                            width: startCropArea.current.width + xDiff,
                            height: startCropArea.current.height + yDiff,
                        });
                        break;
                    }
                }
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
        startResize,
        startDrag,
        startCrop,
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
