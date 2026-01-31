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
            // For text tool, we don't finish on release, but on manual confirmation or switching
            if (previewShape.value.type !== "text") {
                onAddShape(previewShape);
                setPreviewShape(null);
            }
        }
    }, [mouseState.isPressing]);

    useEffect(() => {
        if (mouseState.isPressing && mouseState.pressPosition && pen.type === "text") {
            if (previewShape && previewShape.value.type === "text") {
                // If we are already editing text, finalize it first
                if (previewShape.value.text.trim()) {
                    onAddShape(previewShape);
                }
                // Don't return, proceed to create new one at new position
            }

            setPreviewShape({
                value: {
                    type: "text",
                    point: {
                        x: mouseState.pressPosition.x - cropArea.left,
                        y: mouseState.pressPosition.y - cropArea.top,
                    },
                    text: "",
                    fontSize: pen.fontSize,
                    color: pen.strokeColor,
                },
                strokeColor: pen.strokeColor,
                strokeWidth: 0,
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
                {previewShape && previewShape.value.type !== "text" && <ShapeCollection shape={previewShape} />}
            </svg>

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
                />
            )}
        </div>
    );
};

function TextInput({
    shape,
    onChange,
    onPositionChange,
}: {
    shape: Shape;
    onChange: (text: string) => void;
    onPositionChange: (point: Point) => void;
}) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const draggingRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

    useEffect(() => {
        // Delay focus slightly to ensure it happens after the mouse event that created the input
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    if (shape.value.type !== "text") return null;

    const { point, text, fontSize, color } = shape.value;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent creating new text box
        draggingRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startLeft: point.x,
            startTop: point.y,
        };

        const handleMouseMove = (ev: MouseEvent) => {
            if (!draggingRef.current) return;
            const dx = ev.clientX - draggingRef.current.startX;
            const dy = ev.clientY - draggingRef.current.startY;
            onPositionChange({
                x: draggingRef.current.startLeft + dx,
                y: draggingRef.current.startTop + dy,
            });
        };

        const handleMouseUp = () => {
            draggingRef.current = null;
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            className="absolute bg-transparent outline-none resize-none border border-dashed border-gray-400 p-0 m-0 overflow-hidden"
            style={{
                left: point.x,
                top: point.y,
                fontSize: fontSize,
                color: color,
                fontFamily: "inherit",
                lineHeight: 1.2,
                pointerEvents: "auto",
                minWidth: "50px",
                whiteSpace: "pre",
                width: `${Math.max(text.length * (fontSize * 0.6), 100)}px`,
                height: `${Math.max(text.split("\n").length * fontSize * 1.2, fontSize * 1.5)}px`,
            }}
            placeholder="Type here..."
        />
    );
}

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
                    color={shape.value.color}
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
