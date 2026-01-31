import { cn } from "@/lib/utils";
import { warn } from "@tauri-apps/plugin-log";
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

    const setPreviewShapeStraightLine = (
        pressPosition: Point,
        mousePosition: Point,
        strokeColor: string,
        strokeWidth: number,
    ) => {
        const start = { x: pressPosition.x - cropArea.left, y: pressPosition.y - cropArea.top };
        const end = { x: mousePosition.x - cropArea.left, y: mousePosition.y - cropArea.top };

        setPreviewShape({
            value: { type: "straight_line", start, end },
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    useEffect(() => {
        if (!mouseState.isPressing || !mouseState.pressPosition || !mouseState.mousePosition) {
            return;
        }

        if (pen.type === "rectangle") {
            setPreviewShapeRectangle(
                mouseState.pressPosition,
                mouseState.mousePosition,
                pen.strokeColor,
                pen.strokeWidth,
            );
            return;
        }

        if (pen.type === "straight_line") {
            setPreviewShapeStraightLine(
                mouseState.pressPosition,
                mouseState.mousePosition,
                pen.strokeColor,
                pen.strokeWidth,
            );
            return;
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
                    return <ShapeCollection shape={shape} key={i} />;
                })}
                {previewShape && <ShapeCollection shape={previewShape} />}
            </svg>
        </div>
    );
};

function ShapeCollection({ shape }: { shape: Shape }) {
    if (!shape || !shape.value || !shape.value.type) {
        warn(`[ShapeCollection] invalid shape: ${JSON.stringify(shape)}`);
        return null;
    }

    switch (shape.value.type) {
        case "rectangle": {
            return (
                <RectangleShape
                    rect={shape.value.rect}
                    strokeColor={shape.strokeColor}
                    strokeWidth={shape.strokeWidth}
                />
            );
        }

        case "straight_line": {
            return (
                <StraightLineShape
                    start={shape.value.start}
                    end={shape.value.end}
                    strokeColor={shape.strokeColor}
                    strokeWidth={shape.strokeWidth}
                />
            );
        }
    }
}

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

function StraightLineShape({
    start,
    end,
    strokeColor,
    strokeWidth,
}: {
    start: Point;
    end: Point;
    strokeColor: string;
    strokeWidth: number;
}) {
    return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={strokeColor} strokeWidth={strokeWidth} />;
}

export default PenHandles;
