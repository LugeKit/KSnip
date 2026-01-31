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
    | { type: "rectangle"; strokeColor: string; strokeWidth: number }
    | { type: "free_line"; strokeColor: string; strokeWidth: number }
    | { type: "straight_line"; strokeColor: string; strokeWidth: number }
    | { type: "arrow"; strokeColor: string; strokeWidth: number }
    | { type: "sequence"; strokeColor: string; strokeWidth: number; size: number };

export interface Shape {
    value:
        | { type: "rectangle"; rect: Rectangle }
        | { type: "free_line"; points: Point[] }
        | { type: "straight_line"; start: Point; end: Point }
        | { type: "arrow"; start: Point; end: Point }
        | { type: "sequence"; point: Point; number: number; size: number };
    strokeColor: string;
    strokeWidth: number;
}
