import React, { useState } from "react";
import type { ContextualInfo } from "../types/index.ts";
import Spinner from "./Spinner";
import { SearchIcon, LinkIcon, SparklesIcon } from "./IconComponents";

interface ContextualizerProps {
  dishes: string[];
  onContextualize: (restaurantName: string | null) => void;
  onProcessing: (isProcessing: boolean) => void;
  processing: boolean;
  contextualInfo: ContextualInfo | null;
}

const Contextualizer: React.FC<ContextualizerProps> = ({
  dishes,
  onContextualize,
  onProcessing,
  processing,
  contextualInfo,
}) => {
  const [restaurantName, setRestaurantName] = useState("");

  const handleSearch = () => {
    if (!restaurantName.trim()) return;
    onProcessing(true);
    onContextualize(restaurantName);
  };

  const handleFinalize = (useContext: boolean) => {
    onContextualize(useContext ? restaurantName : null);
  };

  if (processing && !contextualInfo) {
    return <Spinner text="Searching for context..." />;
  }

  if (contextualInfo) {
    return (
      <div className="w-full animate-slide-in-up">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Context Found!
        </h3>
        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 max-h-[30rem] overflow-y-auto">
          <h4 className="font-semibold text-gray-700">
            AI Summary of Vibe & Style:
          </h4>
          <p className="text-sm text-gray-600 mt-2 mb-4 whitespace-pre-wrap">
            {contextualInfo.summary}
          </p>

          {contextualInfo.sources.length > 0 && (
            <>
              <h4 className="font-semibold text-gray-700 mt-4">Sources:</h4>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                {contextualInfo.sources.slice(0, 5).map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      <LinkIcon /> {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleFinalize(true)}
            className="flex-1 flex items-center justify-center bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
          >
            <SparklesIcon /> Use This Context
          </button>
          <button
            onClick={() => handleFinalize(false)}
            className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Generate Without Context
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-slide-in-up">
      <h3 className="text-xl font-semibold text-gray-800 text-center">
        Add Real-World Context
      </h3>
      <p className="text-sm text-gray-500 text-center mt-2 mb-6">
        Optionally, enter the restaurant's name to ground the images in reality.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="e.g., 'The French Laundry, Yountville'"
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
        />
        <button
          onClick={handleSearch}
          disabled={!restaurantName.trim()}
          className="flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400"
        >
          <SearchIcon />
          Search
        </button>
      </div>
      <button
        onClick={() => onContextualize(null)}
        className="mt-4 w-full text-center text-sm text-gray-600 hover:text-orange-600 transition-colors"
      >
        Skip and generate generic images
      </button>
    </div>
  );
};

export default Contextualizer;
