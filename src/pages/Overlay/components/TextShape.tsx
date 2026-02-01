import { useEffect, useLayoutEffect, useRef } from "react";
import { Point, Shape } from "../types";

export function TextShape({ shape }: { shape: Shape }) {
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
            }}
            className="absolute pointer-events-none border border-transparent overflow-visible whitespace-pre"
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
    if (shape.value.type !== "text") return null;

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

    const { point, text, fontSize, color } = shape.value;

    // Adjust height when text changes
    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }

        if (ref.current && preRef.current) {
            const newWidth = Math.max(preRef.current.offsetWidth, 100) + 10;
            ref.current.style.width = `${newWidth}px`;
        }
    }, [text]);

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
        <div>
            <pre
                ref={preRef}
                className="absolute top-0 left-0 outline-none"
                style={{
                    left: point.x,
                    top: point.y,
                    fontSize: fontSize,
                    color: color,
                    fontFamily: "inherit",
                    visibility: "hidden",
                }}
            >
                {text}
            </pre>
            <textarea
                ref={ref}
                value={text}
                onBlur={onConfirm}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                className="absolute top-0 left-0 min-w-10 pointer-events-auto focus:border focus:border-dotted bg-transparent outline-none resize-none border-gray-400 overflow-hidden whitespace-pre"
                style={{
                    left: point.x,
                    top: point.y,
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
