import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { MouseState, Pen, Point, Rectangle, Shape } from "../types";

interface PenHandlesProps {
    cropArea: Rectangle;
    className?: string;
    mouseState: MouseState;
    pen: Pen;
    shapes: Shape[];
    onAddShape: (shape: Shape) => void;
}

const PenHandles: React.FC<PenHandlesProps> = ({ cropArea, className, mouseState, pen, shapes, onAddShape }) => {
    const [previewShape, setPreviewShape] = useState<Shape | null>(null);

    const setPreviewShapeRectangle = (
        pressPosition: Point,
        mousePosition: Point,
        strokeColor: string,
        strokeWidth: number,
    ) => {
        const startX = pressPosition.x - cropArea.left;
        const startY = pressPosition.y - cropArea.top;
        const currentX = mousePosition.x - cropArea.left;
        const currentY = mousePosition.y - cropArea.top;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        setPreviewShape({
            value: { type: "rectangle", rect: { left, top, width, height } },
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    useEffect(() => {
        if (mouseState.isPressing && mouseState.pressPosition && mouseState.mousePosition && pen.type === "rectangle") {
            setPreviewShapeRectangle(
                mouseState.pressPosition,
                mouseState.mousePosition,
                pen.strokeColor,
                pen.strokeWidth,
            );
        }
    }, [mouseState]);

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
                    if (shape.value.type === "rectangle") {
                        return (
                            <RectangleShape
                                key={i}
                                rect={shape.value.rect}
                                strokeColor={shape.strokeColor}
                                strokeWidth={shape.strokeWidth}
                            />
                        );
                    }
                    return null;
                })}
                {previewShape && previewShape.value.type === "rectangle" && (
                    <RectangleShape
                        rect={previewShape.value.rect}
                        strokeColor={previewShape.strokeColor}
                        strokeWidth={previewShape.strokeWidth}
                    />
                )}
            </svg>
        </div>
    );
};

function RectangleShape({
    rect,
    strokeColor,
    strokeWidth,
}: {
    rect: Rectangle;
    strokeColor: string;
    strokeWidth: number;
}) {
    return (
        <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
        />
    );
}

export default PenHandles;
