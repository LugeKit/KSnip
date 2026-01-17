import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { info } from "@tauri-apps/plugin-log";

export default function MainPage() {
    const handleCutMe = () => {
        info('[MainPage] handleCutMe clicked')
        const overlayWindow = new WebviewWindow('screenshot-overlay', {
            url: 'index.html#screenshot',
            fullscreen: true,
            transparent: true,
            decorations: false,
        })

        overlayWindow.once('tauri://created', () => {
            info('[MainPage] overlayWindow created')
        })

        overlayWindow.once('tauri://error', (e) => {
            info(`[MainPage] overlayWindow error: ${e.payload}`)
        })
    }
    return (
        <main className="m-0 h-screen flex flex-col justify-center items-center text-center bg-gray-100 dark:bg-[#2f2f2f] text-[#0f0f0f] dark:text-[#f6f6f6] font-sans antialiased text-base leading-6">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">ksnip</h1>
                <p className="text-gray-600 dark:text-gray-400">Simple Screen Capture Tool</p>
                <button
                    onClick={handleCutMe}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 hover:border-blue-400 border border-transparent transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
                >
                    "Cut Me!"
                </button>
            </div>
        </main>
    );
}