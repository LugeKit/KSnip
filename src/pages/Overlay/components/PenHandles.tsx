import { cn } from "@/lib/utils";
import React from "react";
import { Rectangle } from "../types";

interface PenHandlesProps {
    cropArea: Rectangle;
    className?: string;
}

const PenHandles: React.FC<PenHandlesProps> = ({ cropArea, className }) => {
    return (
        <div
            className={cn("bg-black absolute cursor-wait", className)}
            style={{
                left: cropArea.left,
                top: cropArea.top,
                width: cropArea.width,
                height: cropArea.height,
            }}
        ></div>
    );
};

export default PenHandles;
