import { cn } from "@/lib/utils";
import { warn } from "@tauri-apps/plugin-log";
import React, { useEffect, useRef, useState } from "react";
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

    const setPreviewShapeText = (pressPosition: Point) => {
        setPreviewShape({
            value: {
                type: "text",
                point: {
                    x: pressPosition.x - cropArea.left,
                    y: pressPosition.y - cropArea.top,
                },
                text: "",
                fontSize: 18,
                color: "red",
            },
            strokeColor: "",
            strokeWidth: 0,
        });
    };

    useEffect(() => {
        if (!mouseState.isPressing || !mouseState.pressPosition || !mouseState.mousePosition) {
            return;
        }

        if (previewShape && previewShape.value.type === "text") {
            // If we are already editing text, finalize it first
            if (previewShape.value.text.trim()) {
                finishShape(previewShape);
            }
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
        if (!shape) return;
        onAddShape(shape);
        setPreviewShape(null);
    };

    useEffect(() => {
        if (!mouseState.isPressing) {
            // For text tool, we don't finish on release, but on manual confirmation or switching
            if (previewShape && previewShape.value.type !== "text") {
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
            {previewShape && previewShape.value.type !== "text" && <ShapeCollection shape={previewShape} />}
            {previewShape && previewShape.value.type === "text" && (
                <TextInput
                    shape={previewShape}
                    onChange={(text) => {
                        setPreviewShape((prev) =>
                            prev ? ({ ...prev, value: { ...prev.value, text } } as Shape) : null,
                        );
                    }}
                    onPositionChange={(point) => {
                        setPreviewShape((prev) =>
                            prev ? ({ ...prev, value: { ...prev.value, point } } as Shape) : null,
                        );
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

function TextInput({
    shape,
    onChange,
    onCancel,
    onConfirm,
}: {
    shape: Shape;
    onChange: (text: string) => void;
    onPositionChange: (point: Point) => void;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (shape.value.type !== "text") return null;

    const ref = useRef<HTMLTextAreaElement | null>(null);
    // Auto focus to input area
    useEffect(() => {
        const t = setTimeout(() => {
            if (ref.current) {
                ref.current.focus();
            }
        });
        return () => {
            clearTimeout(t);
        };
    }, [shape]);

    const { point, text, fontSize, color } = shape.value;

    // Adjust height when text changes
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = "auto";
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [text]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();

        if (e.key === "Escape") {
            onCancel();
        }

        if (e.key === "Enter" && e.shiftKey) {
            onConfirm();
        }
    };

    return (
        <textarea
            ref={ref}
            value={text}
            onBlur={onConfirm}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            className="absolute pointer-events-auto hover:border hover:border-dotted focus:border focus:border-dotted bg-transparent outline-none resize-none border-gray-400 p-0 m-0 overflow-hidden"
            style={{
                left: point.x,
                top: point.y,
                fontSize: fontSize,
                color: color,
                lineHeight: 1.2,
                fontFamily: "inherit",
                minWidth: "50px",
                whiteSpace: "pre",
            }}
            placeholder="Type here..."
            rows={1}
        />
    );
}

function ShapeCollection({ shape }: { shape: Shape }) {
    if (!shape || !shape.value || !shape.value.type) {
        warn(`[ShapeCollection] invalid shape: ${JSON.stringify(shape)}`);
        return null;
    }

    switch (shape.value.type) {
        case "text": {
            return <HtmlTextShape shape={shape} />;
        }
        default: {
            return (
                <svg className="absolute top-0 left-0 bg-transparent w-full h-full">
                    <SVGShapeCollection shape={shape} />
                </svg>
            );
        }
    }
}

function SVGShapeCollection({ shape }: { shape: Shape }) {
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
            return null;
        }
    }
}

function HtmlTextShape({ shape }: { shape: Shape }) {
    if (shape.value.type !== "text") return null;
    const { point, text, fontSize, color } = shape.value;

    return (
        <div
            style={{
                left: point.x,
                top: point.y,
                fontSize: fontSize,
                color: color,
                fontFamily: "inherit",
                lineHeight: 1.2,
                whiteSpace: "pre",
            }}
            className="absolute pointer-events-none border border-transparent p-0 m-0 overflow-visible"
        >
            {text}
        </div>
    );
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
