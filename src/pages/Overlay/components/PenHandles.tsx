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
    const [editingText, setEditingText] = useState<{
        point: Point;
        text: string;
        fontSize: number;
        color: string;
    } | null>(null);

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
            if (!prev || !prev.value || prev.value.type !== "free_line") {
                return {
                    value: { type: "free_line", points: [startPoint, currentPoint] },
                    strokeColor: strokeColor,
                    strokeWidth: strokeWidth,
                };
            }

            return {
                ...prev,
                value: {
                    ...prev.value,
                    points: [...prev.value.points, currentPoint],
                },
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
            value: { type: "arrow", start, end },
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    const setPreviewShapeSequence = (mousePosition: Point, strokeColor: string, strokeWidth: number, size: number) => {
        const point = {
            x: mousePosition.x - cropArea.left,
            y: mousePosition.y - cropArea.top,
        };
        const nextNumber = shapes.filter((s) => s.value.type === "sequence").length + 1;

        setPreviewShape({
            value: { type: "sequence", point, number: nextNumber, size },
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
        });
    };

    useEffect(() => {
        if (!mouseState.isPressing || !mouseState.pressPosition || !mouseState.mousePosition) {
            return;
        }

        if (pen.type === "sequence") {
            setPreviewShapeSequence(mouseState.mousePosition, pen.strokeColor, pen.strokeWidth, pen.size);
            return;
        }

        if (pen.type === "text") {
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

        if (pen.type === "arrow") {
            setPreviewShapeArrow(mouseState.pressPosition, mouseState.mousePosition, pen.strokeColor, pen.strokeWidth);
            return;
        }

        if (pen.type === "free_line") {
            setPreviewShapeFreeLine(
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

    useEffect(() => {
        if (mouseState.isPressing && mouseState.pressPosition && pen.type === "text") {
            if (editingText) {
                if (editingText.text.trim()) {
                    onAddShape({
                        value: {
                            type: "text",
                            point: editingText.point,
                            text: editingText.text,
                            fontSize: editingText.fontSize,
                            color: editingText.color,
                        },
                        strokeColor: editingText.color,
                        strokeWidth: 0,
                    });
                }
            }

            setEditingText({
                point: mouseState.pressPosition,
                text: "",
                fontSize: pen.fontSize,
                color: pen.strokeColor,
            });
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

        case "arrow": {
            return (
                <ArrowShape
                    start={shape.value.start}
                    end={shape.value.end}
                    strokeColor={shape.strokeColor}
                    strokeWidth={shape.strokeWidth}
                />
            );
        }

        case "free_line": {
            return (
                <FreeLineShape
                    points={shape.value.points}
                    strokeColor={shape.strokeColor}
                    strokeWidth={shape.strokeWidth}
                />
            );
        }

        case "sequence": {
            return (
                <SequenceShape
                    point={shape.value.point}
                    number={shape.value.number}
                    size={shape.value.size}
                    strokeColor={shape.strokeColor}
                    strokeWidth={shape.strokeWidth}
                />
            );
        }

        case "text": {
            return (
                <TextShape
                    point={shape.value.point}
                    text={shape.value.text}
                    fontSize={shape.value.fontSize}
                    color={"red"}
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

function FreeLineShape({
    points,
    strokeColor,
    strokeWidth,
}: {
    points: Point[];
    strokeColor: string;
    strokeWidth: number;
}) {
    if (points.length < 2) return null;
    const d =
        `M ${points[0].x} ${points[0].y} ` +
        points
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(" ");

    return (
        <path
            d={d}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}

function ArrowShape({
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
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15 + strokeWidth * 2; // Adjust head size based on stroke width
    const arrowAngle = Math.PI / 6; // 30 degrees

    const x1 = end.x - headLength * Math.cos(angle - arrowAngle);
    const y1 = end.y - headLength * Math.sin(angle - arrowAngle);
    const x2 = end.x - headLength * Math.cos(angle + arrowAngle);
    const y2 = end.y - headLength * Math.sin(angle + arrowAngle);

    return (
        <g>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={strokeColor} strokeWidth={strokeWidth} />
            <line
                x1={end.x}
                y1={end.y}
                x2={x1}
                y2={y1}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            <line
                x1={end.x}
                y1={end.y}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
        </g>
    );
}

function SequenceShape({
    point,
    number,
    size,
    strokeColor,
    strokeWidth,
}: {
    point: Point;
    number: number;
    size: number;
    strokeColor: string;
    strokeWidth: number;
}) {
    const radius = size / 2;
    return (
        <g transform={`translate(${point.x}, ${point.y})`}>
            <circle r={radius} stroke={strokeColor} strokeWidth={strokeWidth} fill="transparent" />
            <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill={strokeColor}
                fontSize={size * 0.6}
                fontWeight="bold"
                pointerEvents="none"
                style={{ userSelect: "none" }}
            >
                {number}
            </text>
        </g>
    );
}

export default PenHandles;

function TextShape({ point, text, fontSize, color }: { point: Point; text: string; fontSize: number; color: string }) {
    return (
        <text
            x={point.x}
            y={point.y}
            fill={color}
            fontSize={fontSize}
            dominantBaseline="hanging"
            style={{ whiteSpace: "pre", fontFamily: "inherit", lineHeight: 1.2 }}
        >
            {text.split("\n").map((line, i) => (
                <tspan x={point.x} dy={i === 0 ? 0 : "1.2em"} key={i}>
                    {line}
                </tspan>
            ))}
        </text>
    );
}
