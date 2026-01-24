import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
import { error, info } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";

const RESIZE_SPEED = 100;

export default function PinPage() {
    const [pinID, setPinID] = useState(0);
    const [ratio, setRatio] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const getRatio = async () => {
            const size = await getCurrentWindow().innerSize();
            setRatio(size.width / size.height);
        };
        getRatio();
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
        const app = getCurrentWindow();
        const size = await app.innerSize();
        info(`[PinPage] wheel: ${e.deltaY}, size: ${size.width}, ${size.height}`);

        try {
            const newHeight = size.height + RESIZE_SPEED * (e.deltaY > 0 ? -1 : 1);
            const newWidth = ratio * newHeight;
            await app.setSize(new PhysicalSize(Math.round(newWidth), Math.round(newHeight)));
        } catch (e) {
            error(`[PinPage] failed to set size: ${e}`);
        }
    };

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
        <div className="left-0 top-0 w-screen h-screen bg-transparnent overflow-hidden">
            {pinID > 0 && (
                <img className="top-0 left-0 fixed w-full h-full" src={convertFileSrc(`pin?id=${pinID}`, "ksnip")} />
            )}
            <div
                className="flex fixed top-0 left-0 w-full h-full z-1 items-center justify-center"
                data-tauri-drag-region
                onDoubleClick={() => getCurrentWindow().close()}
                onWheel={onWheel}
            >
                {isDragging && <span>hello world</span>}
            </div>
        </div>
    );
}
