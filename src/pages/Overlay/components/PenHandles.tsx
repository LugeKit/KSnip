import React from "react";
import { Rectangle } from "../types";

interface PenHandlesProps {
    cropArea: Rectangle;
}

const PenHandles: React.FC<PenHandlesProps> = ({ cropArea }) => {
    return (
        <div
            className="bg-black absolute cursor-wait"
            style={{
                left: cropArea.left,
                top: cropArea.top,
                width: cropArea.width,
                height: cropArea.height,
            }}
            onMouseMove={() => {}}
        ></div>
    );
};

export default PenHandles;
