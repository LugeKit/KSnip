import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { useEffect, useState } from "react";

export default function PinPage() {
    const [pinID, setPinID] = useState<number>(0);

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

    return (
        <div className="left-0 top-0 w-screen h-screen bg-transparnent overflow-hidden">
            {pinID > 0 && <img src={convertFileSrc(`pin?id=${pinID}`, "ksnip")} />}
            <div
                className="fixed top-0 left-0 w-full h-full z-1"
                data-tauri-drag-region
                onDoubleClick={() => getCurrentWindow().close()}
                onWheel={(e: React.WheelEvent) => {
                    debug(`[PinPage] wheel: ${e.deltaY}`);
                }}
            />
        </div>
    );
}
