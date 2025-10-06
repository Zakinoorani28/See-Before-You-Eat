import React, { useState, useCallback } from "react";
import { UploadIcon, TextIcon, ImageIcon } from "./IconComponents";
import Spinner from "./Spinner";

interface MenuInputProps {
  onMenuProcessed: (menuText: string) => void;
  onProcessing: (isProcessing: boolean) => void;
  processing: boolean;
  extractTextFromImage: (base64: string, mimeType: string) => Promise<string>;
}

type InputMode = "text" | "image";

const MenuInput: React.FC<MenuInputProps> = ({
  onMenuProcessed,
  onProcessing,
  processing,
  extractTextFromImage,
}) => {
  const [mode, setMode] = useState<InputMode>("image");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleTextSubmit = () => {
    if (!text.trim()) {
      setError("Please paste some menu text.");
      return;
    }
    setError(null);
    onMenuProcessed(text);
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }

      setError(null);
      onProcessing(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          if (!base64) throw new Error("Could not read file.");
          const extractedText = await extractTextFromImage(base64, file.type);
          onMenuProcessed(extractedText);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An unknown error occurred during image processing."
          );
          onProcessing(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        onProcessing(false);
      };
      reader.readAsDataURL(file);
    },
    [extractTextFromImage, onMenuProcessed, onProcessing]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  if (processing) {
    return <Spinner text="Reading Menu..." />;
  }

  return (
    <div className="w-full animate-slide-in-up">
      <div className="flex justify-center mb-4 border border-gray-200 rounded-lg p-1 bg-gray-100">
        <button
          onClick={() => setMode("image")}
          className={`w-1/2 flex items-center justify-center p-2 rounded-md transition-colors ${
            mode === "image"
              ? "bg-white shadow-sm text-orange-600"
              : "text-gray-600"
          }`}
        >
          <ImageIcon /> <span className="ml-2">Upload Image</span>
        </button>
        <button
          onClick={() => setMode("text")}
          className={`w-1/2 flex items-center justify-center p-2 rounded-md transition-colors ${
            mode === "text"
              ? "bg-white shadow-sm text-orange-600"
              : "text-gray-600"
          }`}
        >
          <TextIcon /> <span className="ml-2">Paste Text</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}

      {mode === "image" ? (
        <div onDragEnter={handleDrag} className="relative">
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <UploadIcon />
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-semibold text-orange-600">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          {dragActive && (
            <div
              className="absolute inset-0 w-full h-full"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            ></div>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your menu here..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
          />
          <button
            onClick={handleTextSubmit}
            className="mt-4 w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
          >
            Use Pasted Text
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuInput;
