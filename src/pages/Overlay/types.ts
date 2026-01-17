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
}
