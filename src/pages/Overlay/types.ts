export interface Point {
    x: number;
    y: number;
}

export interface MouseState {
    isPressing: boolean;
    pressPosition: Point | null;
    mousePosition: Point | null;
}

export interface Rectangle {
    left: number;
    top: number;
    width: number;
    height: number;
}

export enum ResizeArea {
    None,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Left,
    Right,
    Top,
    Bottom,
}

export type MouseMoveType =
    | { type: "idle" }
    | { type: "cropping" }
    | { type: "dragging" }
    | { type: "resizing"; direction: ResizeArea }
    | { type: "painting" };

export type Pen =
    | { type: "none" }
    | { type: "rectangle"; color: string; strokeWidth: number }
    | { type: "free_line"; color: string; strokeWidth: number }
    | { type: "straight_line"; color: string; strokeWidth: number }
    | { type: "arrow"; color: string; strokeWidth: number }
    | { type: "sequence"; color: string; strokeWidth: number; size: number }
    | { type: "text" };

export type Shape =
    | { type: "rectangle"; rect: Rectangle; strokeColor: string; strokeWidth: number }
    | { type: "free_line"; points: Point[]; strokeColor: string; strokeWidth: number }
    | { type: "straight_line"; start: Point; end: Point; strokeColor: string; strokeWidth: number }
    | { type: "arrow"; start: Point; end: Point; strokeColor: string; strokeWidth: number }
    | { type: "sequence"; point: Point; number: number; size: number; strokeColor: string; strokeWidth: number }
    | { type: "text"; point: Point; text: string; fontSize: number; color: string };
