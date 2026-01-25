import { useState } from "react";
import { Point } from "../types";

export function useMouseEvent() {
    const [isPressing, setIsPressing] = useState(false);
    const [pressPosition, setPressPosition] = useState<Point | null>(null);
    const [mousePosition, setMousePosition] = useState<Point | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPressing(true);
        setPressPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setPressPosition(null);
        setIsPressing(false);
    };

    return {
        isPressing,
        pressPosition,
        mousePosition,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}
