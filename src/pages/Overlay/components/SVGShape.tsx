import { Point, Rectangle, Shape } from "../types";

export function SVGShape({ shape }: { shape: Shape }) {
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
