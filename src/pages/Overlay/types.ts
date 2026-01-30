
export interface Point {
    x: number;
    y: number;
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
    | { type: "cropping" }
    | { type: "dragging" }
    | { type: "resizing"; direction: ResizeArea };

export enum PenType {
    None,
    Rectangle,
}
