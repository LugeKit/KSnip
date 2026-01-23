import { info } from "@tauri-apps/plugin-log";
import MainPage from "./pages/Main/MainPage";
import OverlayPage from "./pages/Overlay/OverlayPage";
import PinPage from "./pages/Pin/PinPage";

export default function App() {
    const hash = window.location.hash;
    info(`[App] current location hash: ${hash}`);

    switch (hash) {
        case "#screenshot":
            return <OverlayPage />;
        case "#pin":
            return <PinPage />;
        default:
            return <MainPage />;
    }
}
