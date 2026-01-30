import { currentMonitor } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { MouseMoveType, MouseState, Point, Rectangle, ResizeArea } from "../types";

export function useCrop(mouseState: MouseState) {
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [mouseMoveType, setMouseMoveType] = useState<MouseMoveType>({ type: "cropping" });
    const startCropArea = useRef<Rectangle | null>(null);

    // IMPORTANT:
    // truncate logical crop area to physical,
    // avoid physical pixel mistake when making screenshot
    const setCropAreaByPhysicalTruncate = async (rectangle: Rectangle) => {
        const truncatedCropArea = await physicalTruncate(rectangle);
        setCropArea(truncatedCropArea);
    };

    const makingMouseMoveByType = (mousePosition: Point, pressPosition: Point) => {
        switch (mouseMoveType.type) {
            case "cropping": {
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
            case "dragging": {
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
            case "resizing": {
                if (!cropArea || !startCropArea.current) {
                    return;
                }

                const { direction } = mouseMoveType;

                const xDiff = mousePosition.x - pressPosition.x;
                const yDiff = mousePosition.y - pressPosition.y;

                switch (direction) {
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
        if (mouseState.isPressing) {
            startCropArea.current = cropArea;
        }
    }, [mouseState.isPressing]);

    useEffect(() => {
        if (!mouseState.isPressing || !mouseState.mousePosition || !mouseState.pressPosition) {
            return;
        }
        makingMouseMoveByType(mouseState.mousePosition, mouseState.pressPosition);
    }, [mouseState]);

    const cancelCrop = () => {
        setCropArea(null);
    };

    return {
        cropArea,
        cancelCrop,
        mouseMoveType,
        setMouseType: setMouseMoveType,
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
