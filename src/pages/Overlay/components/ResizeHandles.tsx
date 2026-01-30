import React from "react";
import { Rectangle, ResizeArea } from "../types";

interface ResizeHandlesProps {
    cropArea: Rectangle | null;
    onResizeStart: (direction: ResizeArea) => void;
    onDragStart: () => void;
}

const HANDLE_SIZE = 10; // Hit area

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ cropArea, onResizeStart, onDragStart }) => {
    if (!cropArea) return null;

    const handleMouseDown = (e: React.MouseEvent, direction: ResizeArea) => {
        e.preventDefault();
        // We allow propagation so that the global useMouseEvent hook can detect the press state
        // and initialize pressPosition, which is needed for the drag logic in useCrop.
        onResizeStart(direction);
    };

    // Common styles for hit areas. Using a larger hit area for better UX.
    // We can make them invisible (transparent) or give them a debug color if needed.
    // For now, let's make them transparent.
    const baseHandleStyle = "absolute pointer-events-auto z-50";

    return (
        <div
            className="absolute pointer-events-auto cursor-move"
            style={{
                left: cropArea.left,
                top: cropArea.top,
                width: cropArea.width,
                height: cropArea.height,
            }}
            onMouseDown={(e) => {
                if (e.target !== e.currentTarget) return;
                e.preventDefault();
                onDragStart();
            }}
        >
            {/* Corners */}
            <div
                className={`${baseHandleStyle} cursor-nw-resize`}
                style={{
                    top: -HANDLE_SIZE / 2,
                    left: -HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.TopLeft)}
            />
            <div
                className={`${baseHandleStyle} cursor-ne-resize`}
                style={{
                    top: -HANDLE_SIZE / 2,
                    right: -HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.TopRight)}
            />
            <div
                className={`${baseHandleStyle} cursor-sw-resize`}
                style={{
                    bottom: -HANDLE_SIZE / 2,
                    left: -HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.BottomLeft)}
            />
            <div
                className={`${baseHandleStyle} cursor-se-resize`}
                style={{
                    bottom: -HANDLE_SIZE / 2,
                    right: -HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.BottomRight)}
            />

            {/* Edges - We need them to stretch along the side */}
            {/* Top */}
            <div
                className={`${baseHandleStyle} cursor-n-resize`}
                style={{
                    top: -HANDLE_SIZE / 2,
                    left: HANDLE_SIZE / 2,
                    right: HANDLE_SIZE / 2,
                    height: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.Top)}
            />
            {/* Bottom */}
            <div
                className={`${baseHandleStyle} cursor-s-resize`}
                style={{
                    bottom: -HANDLE_SIZE / 2,
                    left: HANDLE_SIZE / 2,
                    right: HANDLE_SIZE / 2,
                    height: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.Bottom)}
            />
            {/* Left */}
            <div
                className={`${baseHandleStyle} cursor-w-resize`}
                style={{
                    left: -HANDLE_SIZE / 2,
                    top: HANDLE_SIZE / 2,
                    bottom: HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.Left)}
            />
            {/* Right */}
            <div
                className={`${baseHandleStyle} cursor-e-resize`}
                style={{
                    right: -HANDLE_SIZE / 2,
                    top: HANDLE_SIZE / 2,
                    bottom: HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                }}
                onMouseDown={(e) => handleMouseDown(e, ResizeArea.Right)}
            />
        </div>
    );
};

export default ResizeHandles;
