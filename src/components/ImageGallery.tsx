import React, { useState, useEffect } from "react";
import type { GeneratedDish } from "../types/index.ts";
import { BackIcon } from "../components/IconComponents";

interface ImageModalProps {
  dish: GeneratedDish;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ dish, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-4 max-w-3xl w-11/12 max-h-[90vh] flex flex-col animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`data:image/png;base64,${dish.imageBase64}`}
          alt={`Enlarged view of ${dish.name}`}
          className="w-full h-auto object-contain rounded-t-lg"
        />
        <div className="text-center p-4">
          <h3 className="font-bold text-xl text-gray-800">{dish.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white rounded-full p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface ImageGalleryProps {
  dishes: GeneratedDish[];
  onReset: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ dishes, onReset }) => {
  const [selectedDish, setSelectedDish] = useState<GeneratedDish | null>(null);

  return (
    <div className="w-full animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
        Here's your order!
      </h2>
      <p className="text-center text-gray-500 mb-8">
        Click on an image to view it in full size.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map((dish, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 animate-slide-in-up cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => setSelectedDish(dish)}
          >
            <img
              src={`data:image/png;base64,${dish.imageBase64}`}
              alt={`Generated image of ${dish.name}`}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-800 truncate">
                {dish.name}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={onReset}
          className="flex items-center justify-center mx-auto bg-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
        >
          <BackIcon /> Start Over
        </button>
      </div>

      {selectedDish && (
        <ImageModal dish={selectedDish} onClose={() => setSelectedDish(null)} />
      )}
    </div>
  );
};

export default ImageGallery;
