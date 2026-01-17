import { getCurrentWindow } from "@tauri-apps/api/window";
import { info } from "@tauri-apps/plugin-log";
import React, { useCallback, useEffect, useState } from "react";

interface Point {
    x: number;
    y: number;
}

interface Rectangle {
    left: number;
    top: number;
    width: number;
    height: number;
}

const screenshotThresholdPixel = 5;

export default function OverlayPage() {
    info(`[OverlayPage] OverlayPage loaded`);
    const [startPosition, setStartPosition] = useState<Point | null>(null);
    const [cropArea, setCropArea] = useState<Rectangle | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // closeOverlayPage closes the overlay page
    const closeOverlayPage = useCallback(() => {
        const appWindow = getCurrentWindow();
        appWindow.close();
    }, []);

    // register global keydown event listener to close overlay page
    // press "Esc" to close the overlay page
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeOverlayPage();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [closeOverlayPage]);

    const handleMouseDown = (e: React.MouseEvent) => {
        info(`[OverlayPage] handleMouseDown: ${e.clientX}, ${e.clientY}`);
        setStartPosition({ x: e.clientX, y: e.clientY });
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !startPosition) {
            return;
        }
        info(`[OverlayPage] handleMouseMove: ${e.clientX}, ${e.clientY}`);

        const currentPosition = { x: e.clientX, y: e.clientY };
        const width = Math.abs(startPosition.x - currentPosition.x);
        const height = Math.abs(startPosition.y - currentPosition.y);
        if (
            width <= screenshotThresholdPixel ||
            height <= screenshotThresholdPixel
        ) {
            return;
        }

        setCropArea({
            left: Math.min(startPosition.x, currentPosition.x),
            top: Math.min(startPosition.y, currentPosition.y),
            width,
            height,
        });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        info(`[OverlayPage] handleMouseUp: ${e.clientX}, ${e.clientY}`);
        setIsDragging(false);
    };

    return (
        <div
            className="fixed bg-gray-800/20 w-screen h-screen"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {cropArea && (
                <div
                    className="absolute border-2 border-red-500 bg-transparent"
                    style={{ ...cropArea }}
                />
            )}
        </div>
    );
}
