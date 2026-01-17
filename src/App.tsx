import { info } from "@tauri-apps/plugin-log";
import MainPage from "./pages/Main";
import OverlayPage from "./pages/Overlay";

function App() {
    const hash = window.location.hash;
    info(`[App] current location hash: ${hash}`)

    switch (hash) {
        case '#screenshot':
            return (
                <OverlayPage />
            )
        default:
            return (
                <MainPage />
            )
    }

}

export default App;
