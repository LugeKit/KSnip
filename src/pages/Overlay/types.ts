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
    Cropping,
    Dragging,
    Resizing,
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
