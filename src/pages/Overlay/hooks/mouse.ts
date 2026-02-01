import { useState } from "react";
import { MouseState } from "../types";

export function useMouseEvent() {
    const [mouseState, setMouseState] = useState<MouseState>({
        isPressing: false,
        pressPosition: null,
        mousePosition: null,
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        // Prevent default behavior to avoid focus stealing from TextInput
        e.preventDefault();
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
