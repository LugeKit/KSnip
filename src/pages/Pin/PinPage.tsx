import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { useEffect, useMemo, useRef, useState } from "react";

const RESIZE_SPEED = 0.1;
const MIN_RATIO = 0.1;
const MAX_RATIO = 5.0;

export default function PinPage() {
    const [pinID, setPinID] = useState(0);
    const [ratio, setRatio] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const src = useMemo(() => convertFileSrc(`pin?id=${pinID}`, "ksnip"), [pinID]);

    const rawWidth = useRef(0);
    const rawHeight = useRef(0);
    useEffect(() => {
        const app = getCurrentWindow();
        app.innerSize().then((size) => {
            rawWidth.current = size.width;
            rawHeight.current = size.height;
        });
    }, []);

    useEffect(() => {
        const hash = window.location.hash;
        const param = new URLSearchParams(hash.split("?")[1]);
        const id = param.get("id");
        if (id) {
            info(`[PinPage] pinID: ${id}`);
            setPinID(parseInt(id));
            return;
        }

        error(`[PinPage] failed to get pinID from hash: ${hash}`);
        getCurrentWindow().close();
    }, []);

    useEffect(() => {
        const unlistenPromise = getCurrentWindow().once("tauri://close-requested", async () => {
            info(`[PinPage] close-requested: ${pinID}`);
            if (pinID > 0) {
                try {
                    await invoke("pin_delete", { pinId: pinID });
                } catch (e) {
                    error(`[PinPage] failed to delete pin: ${e}`);
                }
            }

            await getCurrentWindow().close();
        });
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [pinID]);

    const onWheel = async (e: React.WheelEvent) => {
        const newRatio = ratio + (e.deltaY > 0 ? -RESIZE_SPEED : RESIZE_SPEED);
        debug(`[PinPage] ratio: ${ratio} newRatio: ${newRatio}`);
        if (newRatio < MIN_RATIO) {
            setRatio(MIN_RATIO);
            return;
        }

        if (newRatio > MAX_RATIO) {
            setRatio(MAX_RATIO);
            return;
        }

        setRatio(newRatio);
    };

    useEffect(() => {
        const resize = async () => {
            if (rawWidth.current === 0 || rawHeight.current === 0) {
                return;
            }

            const app = getCurrentWindow();
            const scale = await app.scaleFactor();
            if (scale <= 0) {
                error(`[PinPage] failed to get scaleFactor: ${scale}`);
                return;
            }

            // use logical size rather than physical size in front display to avoid floating point size
            const newWidth = Math.round((rawWidth.current * ratio) / scale);
            const newHeight = Math.round((rawHeight.current * ratio) / scale);

            app.setSize(new LogicalSize(newWidth, newHeight));
        };
        resize();
    }, [ratio]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const unlisten = getCurrentWindow().listen("tauri://move", () => {
            setIsDragging(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setIsDragging(false);
            }, 100);
        });

        return () => {
            unlisten.then((unlisten) => unlisten());
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="left-0 top-0 w-screen h-screen bg-transparent overflow-hidden border-none">
            {pinID > 0 && <img className="top-0 left-0 fixed w-full h-full object-fill border-none" src={src} />}
            <div
                className="flex fixed bg-transparent top-0 left-0 w-full h-full z-1 items-center justify-center border-none"
                data-tauri-drag-region
                onDoubleClick={() => getCurrentWindow().close()}
                onWheel={onWheel}
            >
                {isDragging && (
                    <div className="flex items-center justify-center bg-muted p-4 rounded-md">
                        <span>"double click" to close the pin</span>
                    </div>
                )}
            </div>
        </div>
    );
}
