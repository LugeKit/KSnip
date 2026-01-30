import { useState } from "react";
import { MouseState } from "../types";

export function useMouseEvent() {
    const [mouseState, setMouseState] = useState<MouseState>({
        isPressing: false,
        pressPosition: null,
        mousePosition: null,
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        setMouseState((prev) => ({
            ...prev,
            isPressing: true,
            pressPosition: { x: e.clientX, y: e.clientY },
        }));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMouseState((prev) => ({
            ...prev,
            mousePosition: { x: e.clientX, y: e.clientY },
        }));
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setMouseState((prev) => ({
            ...prev,
            isPressing: false,
            pressPosition: null,
        }));
    };

    return {
        mouseState,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}
