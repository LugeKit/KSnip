export default function AppHeader() {
    return (
        <div className="fixed w-full h-10" data-tauri-drag-region>
            <div className="absolute w-full h-full bg-black z-999" data-tauri-drag-region/>
            <div className="border-b w-full mt-10 ml-1 mr-1" />
        </div>
    )
}
