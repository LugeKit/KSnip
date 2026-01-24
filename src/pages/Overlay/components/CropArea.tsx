import React from "react";
import { Rectangle } from "../types";

const CROP_AREA_STROKE_WIDTH = 1;

interface CropAreaProps {
    cropArea: Rectangle | null;
}

const CropArea: React.FC<CropAreaProps> = ({ cropArea }) => {
    return (
        <svg className="absolute w-full h-full pointer-events-none will-change-transform">
            <defs>
                <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    {cropArea && (
                        <rect
                            x={cropArea.left}
                            y={cropArea.top}
                            width={cropArea.width}
                            height={cropArea.height}
                            fill="black"
                        />
                    )}
                </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(31, 41, 55, 0.7)" mask="url(#crop-mask)" />
            {cropArea && (
                <rect
                    x={cropArea.left - CROP_AREA_STROKE_WIDTH}
                    y={cropArea.top - CROP_AREA_STROKE_WIDTH}
                    width={cropArea.width + 2 * CROP_AREA_STROKE_WIDTH}
                    height={cropArea.height + 2 * CROP_AREA_STROKE_WIDTH}
                    stroke="red"
                    strokeWidth={CROP_AREA_STROKE_WIDTH}
                    fill="none"
                />
            )}
        </svg>
    );
};

export default CropArea;
