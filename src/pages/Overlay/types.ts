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

export interface Shape {
    value:
        | { type: "rectangle"; rect: Rectangle }
        | { type: "free_line"; points: Point[] }
        | { type: "straight_line"; start: Point; end: Point }
        | { type: "arrow"; start: Point; end: Point }
        | { type: "sequence"; point: Point; number: number; size: number }
        | { type: "text"; point: Point; text: string; fontSize: number; color: string };
    strokeColor: string;
    strokeWidth: number;
}
