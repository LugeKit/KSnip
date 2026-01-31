import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import { MouseState, PenType, Rectangle, Shape } from "../types";

interface PenHandlesProps {
    cropArea: Rectangle;
    className?: string;
    mouseState: MouseState;
    penType: PenType;
    shapes: Shape[];
    onAddShape: (shape: Shape) => void;
}

const PenHandles: React.FC<PenHandlesProps> = ({ cropArea, className, mouseState, penType, shapes, onAddShape }) => {
    const wasPressing = useRef(false);

    // Calculate the current shape being drawn (preview)
    let previewShape: Shape | null = null;
    if (
        mouseState.isPressing &&
        mouseState.pressPosition &&
        mouseState.mousePosition &&
        penType === PenType.Rectangle
    ) {
        const startX = mouseState.pressPosition.x - cropArea.left;
        const startY = mouseState.pressPosition.y - cropArea.top;
        const currentX = mouseState.mousePosition.x - cropArea.left;
        const currentY = mouseState.mousePosition.y - cropArea.top;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        previewShape = {
            value: { type: penType, rect: { left, top, width, height } },
            strokeColor: "red",
            strokeWidth: 2,
        };
    }

    // Keep track of the latest preview shape to commit it when mouse is released
    const previewShapeRef = useRef<Shape | null>(null);
    if (previewShape) {
        previewShapeRef.current = previewShape;
    }

    useEffect(() => {
        // If mouse was pressing and now is not, it means the user released the mouse (finished drawing)
        if (wasPressing.current && !mouseState.isPressing) {
            if (previewShapeRef.current) {
                onAddShape(previewShapeRef.current);
                previewShapeRef.current = null;
            }
        }
        wasPressing.current = mouseState.isPressing;
    }, [mouseState.isPressing, onAddShape]);

    return (
        <div
            className={cn("bg-transparent absolute overflow-hidden", className)}
            style={{
                left: cropArea.left,
                top: cropArea.top,
                width: cropArea.width,
                height: cropArea.height,
            }}
        >
            <svg width="100%" height="100%">
                {shapes.map((shape, i) => {
                    if (shape.value.type === PenType.Rectangle) {
                        return (
                            <rect
                                key={i}
                                x={shape.value.rect.left}
                                y={shape.value.rect.top}
                                width={shape.value.rect.width}
                                height={shape.value.rect.height}
                                stroke={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                                fill="transparent"
                            />
                        );
                    }
                    return null;
                })}
                {previewShape && previewShape.value.type === PenType.Rectangle && (
                    <rect
                        x={previewShape.value.rect.left}
                        y={previewShape.value.rect.top}
                        width={previewShape.value.rect.width}
                        height={previewShape.value.rect.height}
                        stroke={
                            previewShape.value.rect.width > 0 && previewShape.value.rect.height > 0
                                ? previewShape.strokeColor
                                : "transparent"
                        }
                        strokeWidth={previewShape.strokeWidth}
                        fill="transparent"
                    />
                )}
            </svg>
        </div>
    );
};

export default PenHandles;
