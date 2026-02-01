import { cn } from "@/lib/utils";
import { warn } from "@tauri-apps/plugin-log";
import React, { useEffect, useState } from "react";
import { MouseState, Pen, Point, Rectangle, Shape } from "../types";
import { SVGShape } from "./SVGShape";
import { TextInput, TextShape } from "./TextShape";

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
            type: "rectangle",
            rect: { left, top, width, height },
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
            type: "straight_line",
            start,
            end,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    const setPreviewShapeFreeLine = (
        pressPosition: Point,
        mousePosition: Point,
        strokeColor: string,
        strokeWidth: number,
    ) => {
        const startPoint = {
            x: pressPosition.x - cropArea.left,
            y: pressPosition.y - cropArea.top,
        };
        const currentPoint = {
            x: mousePosition.x - cropArea.left,
            y: mousePosition.y - cropArea.top,
        };

        setPreviewShape((prev) => {
            if (!prev || prev.type !== "free_line") {
                return {
                    type: "free_line",
                    points: [startPoint, currentPoint],
                    strokeColor: strokeColor,
                    strokeWidth: strokeWidth,
                };
            }

            return {
                ...prev,
                points: [...prev.points, currentPoint],
            };
        });
    };

    const setPreviewShapeArrow = (
        pressPosition: Point,
        mousePosition: Point,
        strokeColor: string,
        strokeWidth: number,
    ) => {
        const start = { x: pressPosition.x - cropArea.left, y: pressPosition.y - cropArea.top };
        const end = { x: mousePosition.x - cropArea.left, y: mousePosition.y - cropArea.top };

        setPreviewShape({
            type: "arrow",
            start,
            end,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    const setPreviewShapeSequence = (mousePosition: Point, strokeColor: string, strokeWidth: number, size: number) => {
        const point = {
            x: mousePosition.x - cropArea.left,
            y: mousePosition.y - cropArea.top,
        };
        const nextNumber = shapes.filter((s) => s.type === "sequence").length + 1;

        setPreviewShape({
            type: "sequence",
            point,
            number: nextNumber,
            size,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    const setPreviewShapeText = (pressPosition: Point) => {
        setPreviewShape({
            type: "text",
            point: {
                x: pressPosition.x - cropArea.left,
                y: pressPosition.y - cropArea.top,
            },
            text: "",
            fontSize: 18,
            color: "red",
        });
    };

    useEffect(() => {
        if (!mouseState.isPressing || !mouseState.pressPosition || !mouseState.mousePosition) {
            return;
        }

        if (previewShape && previewShape.type === "text") {
            finishShape(previewShape);
        }

        if (pen.type === "sequence") {
            setPreviewShapeSequence(mouseState.mousePosition, pen.color, pen.strokeWidth, pen.size);
            return;
        }

        if (pen.type === "text") {
            setPreviewShapeText(mouseState.mousePosition);
            return;
        }

        if (pen.type === "rectangle") {
            setPreviewShapeRectangle(mouseState.pressPosition, mouseState.mousePosition, pen.color, pen.strokeWidth);
            return;
        }

        if (pen.type === "straight_line") {
            setPreviewShapeStraightLine(mouseState.pressPosition, mouseState.mousePosition, pen.color, pen.strokeWidth);
            return;
        }

        if (pen.type === "arrow") {
            setPreviewShapeArrow(mouseState.pressPosition, mouseState.mousePosition, pen.color, pen.strokeWidth);
            return;
        }

        if (pen.type === "free_line") {
            setPreviewShapeFreeLine(mouseState.pressPosition, mouseState.mousePosition, pen.color, pen.strokeWidth);
            return;
        }
    }, [mouseState]);

    const finishShape = (shape: Shape | null) => {
        setPreviewShape(null);
        if (!shape) return;

        // For text shape, no text means cancel
        if (shape.type === "text") {
            if (!shape.text.trim()) {
                return;
            }
        }

        if (shape.type === "rectangle") {
            if (!shape.rect || shape.rect.width === 0 || shape.rect.height === 0) {
                return;
            }
        }

        onAddShape(shape);
    };

    useEffect(() => {
        if (!mouseState.isPressing) {
            // For text tool, we don't finish on release, but on manual confirmation or switching
            if (previewShape && previewShape.type !== "text") {
                finishShape(previewShape);
            }
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
            {shapes.map((shape, i) => {
                return <ShapeCollection shape={shape} key={i} />;
            })}
            {previewShape && previewShape.type !== "text" && <ShapeCollection shape={previewShape} />}
            {previewShape && previewShape.type === "text" && (
                <TextInput
                    shape={previewShape}
                    onChange={(text) => {
                        setPreviewShape((prev) => (prev && prev.type === "text" ? { ...prev, text } : null));
                    }}
                    onPositionChange={(point) => {
                        setPreviewShape((prev) => (prev && prev.type === "text" ? { ...prev, point } : null));
                    }}
                    onCancel={() => {
                        setPreviewShape(null);
                    }}
                    onConfirm={() => {
                        finishShape(previewShape);
                    }}
                />
            )}
        </div>
    );
};

export default PenHandles;

function ShapeCollection({ shape }: { shape: Shape }) {
    if (!shape || !shape.type) {
        warn(`[ShapeCollection] invalid shape: ${JSON.stringify(shape)}`);
        return null;
    }

    switch (shape.type) {
        case "text": {
            return <TextShape shape={shape} />;
        }
        default: {
            return (
                <svg className="absolute top-0 left-0 bg-transparent w-full h-full">
                    <SVGShape shape={shape} />
                </svg>
            );
        }
    }
}
