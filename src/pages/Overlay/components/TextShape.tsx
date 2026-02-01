import { useEffect, useRef } from "react";
import { Point, Shape } from "../types";

export function TextShape({ shape }: { shape: Shape }) {
    if (shape.type !== "text") return null;
    const { point, text, fontSize, color } = shape;

    return (
        <div
            style={{
                left: point.x,
                top: point.y,
                fontSize: fontSize,
                color: color,
                fontFamily: "inherit",
            }}
            className="absolute p-1 pointer-events-none border border-transparent overflow-visible whitespace-pre"
        >
            {text}
        </div>
    );
}

export function TextInput({
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
    if (shape.type !== "text") return null;

    const ref = useRef<HTMLTextAreaElement | null>(null);
    const preRef = useRef<HTMLPreElement | null>(null);
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

    const { point, text, fontSize, color } = shape;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Escape" && e.shiftKey) {
            onCancel();
            return;
        }

        if (e.key === "Escape") {
            onConfirm();
        }
    };

    return (
        <div
            className="relative inline-grid border border-gray-400 border-dotted p-1 pr-2"
            style={{
                left: point.x,
                top: point.y,
                gridTemplateColumns: "1fr",
            }}
            onBlur={onConfirm}
        >
            <pre
                ref={preRef}
                aria-hidden={true}
                className="invisible outline-none col-start-1 row-start-1"
                style={{
                    fontSize: fontSize,
                    color: color,
                    fontFamily: "inherit",
                }}
            >
                {text || " "}
                {"\n"}
            </pre>
            <textarea
                ref={ref}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                className="col-start-1 row-start-1 min-w-10 pointer-events-auto bg-transparent outline-none resize-none overflow-hidden whitespace-pre"
                style={{
                    fontSize: fontSize,
                    color: color,
                    fontFamily: "inherit",
                }}
                placeholder="Type here..."
                rows={1}
            />
        </div>
    );
}
