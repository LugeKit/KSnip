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
    | { type: "painting"; pen: PenType };

export enum PenType {
    None,
    Rectangle,
}

export interface Shape {
    value: {
        type: PenType.Rectangle;
        rect: Rectangle;
    };
    strokeColor: string;
    strokeWidth: number;
}
