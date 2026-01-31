import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { MouseState, PenType, Rectangle, Shape } from "../types";

interface PenHandlesProps {
    cropArea: Rectangle;
    className?: string;
    mouseState: MouseState;
    pen: PenType;
    shapes: Shape[];
    onAddShape: (shape: Shape) => void;
}

const PenHandles: React.FC<PenHandlesProps> = ({ cropArea, className, mouseState, pen, shapes, onAddShape }) => {
    const [previewShape, setPreviewShape] = useState<Shape | null>(null);
    useEffect(() => {
        if (
            mouseState.isPressing &&
            mouseState.pressPosition &&
            mouseState.mousePosition &&
            pen === PenType.Rectangle
        ) {
            const startX = mouseState.pressPosition.x - cropArea.left;
            const startY = mouseState.pressPosition.y - cropArea.top;
            const currentX = mouseState.mousePosition.x - cropArea.left;
            const currentY = mouseState.mousePosition.y - cropArea.top;

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            setPreviewShape({
                value: { type: pen, rect: { left, top, width, height } },
                strokeColor: "red",
                strokeWidth: 2,
            });
        }
    }, [pen, mouseState]);

    useEffect(() => {
        if (!mouseState.isPressing && previewShape) {
            onAddShape(previewShape);
            setPreviewShape(null);
        }
    }, [mouseState.isPressing]);

    return (
        <div
            className={cn("bg-transparent absolute overflow-hidden pointer-events-none", className)}
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
                        return <RectangleShape key={i} shape={shape} />;
                    }
                    return null;
                })}
                {previewShape && previewShape.value.type === PenType.Rectangle && (
                    <RectangleShape shape={previewShape} />
                )}
            </svg>
        </div>
    );
};

function RectangleShape({ shape }: { shape: Shape }) {
    return (
        <rect
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

export default PenHandles;
