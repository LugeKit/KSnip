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

export enum MouseMoveType {
    NotPressed,
    Cropping,
    Dragging,
    Resizing,
}

export enum ResizeArea {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Left,
    Right,
    Top,
    Bottom,
}
