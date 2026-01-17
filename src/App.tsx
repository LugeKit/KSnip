import { useState } from "react";

function App() {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCutMe = async () => {
    setIsCapturing(true);
    try {
    } catch (error) {
      console.error("Failed to capture screen:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <main className="m-0 h-screen flex flex-col justify-center items-center text-center bg-gray-100">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">ksnip</h1>
        <p className="text-gray-600">Simple Screen Capture Tool</p>
        <button
          onClick={handleCutMe}
          disabled={isCapturing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isCapturing ? "Capturing..." : "Cut Me!"}
        </button>
      </div>
    </main>
  );
}

export default App;
