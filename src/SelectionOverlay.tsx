import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SelectionOverlayProps {
  screenshot: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function SelectionOverlay({ screenshot, onComplete, onCancel }: SelectionOverlayProps) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startPos) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async () => {
    if (startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(startPos.x - currentPos.x);
      const height = Math.abs(startPos.y - currentPos.y);

      if (width > 5 && height > 5) {
        try {
          await invoke("save_to_clipboard", { x, y, width, height });
          onComplete();
        } catch (error) {
          console.error("Failed to save to clipboard:", error);
          onCancel();
        }
      } else {
        setStartPos(null);
        setCurrentPos(null);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const selectionStyle = startPos && currentPos ? {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(startPos.x - currentPos.x),
    height: Math.abs(startPos.y - currentPos.y),
  } : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] cursor-crosshair overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <img
        src={screenshot}
        alt="screenshot"
        className="absolute inset-0 w-full h-full object-cover select-none"
      />
      <div className="absolute inset-0 bg-black/30" />
      {selectionStyle && (
        <div
          className="absolute border-2 border-blue-500 bg-transparent"
          style={{
            ...selectionStyle,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
          }}
        />
      )}
      <div className="absolute top-4 left-4 text-white bg-black/50 px-2 py-1 rounded text-sm pointer-events-none">
        Esc to cancel, Drag to select
      </div>
    </div>
  );
}
