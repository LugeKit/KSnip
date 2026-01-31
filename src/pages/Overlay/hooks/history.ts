import { useState } from "react";
import { Shape } from "../types";

export function useShapeHistory() {
    const [history, setHistory] = useState<Shape[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const shapes = history[historyIndex];

    const addShape = (shape: Shape) => {
        const nextShapes = [...history[historyIndex], shape];
        const nextHistory = history.slice(0, historyIndex + 1);
        nextHistory.push(nextShapes);
        setHistory(nextHistory);
        setHistoryIndex(nextHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    return {
        shapes,
        addShape,
        undo,
        redo,
    };
}
