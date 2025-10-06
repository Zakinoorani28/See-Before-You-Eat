import React, { useState, useEffect } from "react";
import { SparklesIcon } from "./IconComponents";
import { extractDishesFromMenu } from "../services/geminiService";

interface DishSelectorProps {
  menuText: string;
  onDishesSelected: (dishes: string[]) => void;
}

const AutocompleteInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: string[];
}> = ({ value, onChange, placeholder, suggestions }) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value;
    onChange(userInput);
    if (userInput && suggestions.length > 0) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const onSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  };

  const onFocus = () => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().indexOf(value.toLowerCase()) > -1
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={onFocus}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // delay to allow click
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onMouseDown={() => onSuggestionClick(suggestion)}
              className="p-3 cursor-pointer hover:bg-orange-100"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DishSelector: React.FC<DishSelectorProps> = ({
  menuText,
  onDishesSelected,
}) => {
  const [dishes, setDishes] = useState<string[]>(["", "", ""]);
  const [allDishes, setAllDishes] = useState<string[]>([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        setIsLoadingDishes(true);
        const extracted = await extractDishesFromMenu(menuText);
        setAllDishes(extracted);
      } catch (e) {
        console.error("Could not extract dishes, will allow free text.", e);
        setAllDishes([]); // Ensure suggestions are empty on failure
      } finally {
        setIsLoadingDishes(false);
      }
    };
    fetchDishes();
  }, [menuText]);

  const handleDishChange = (index: number, value: string) => {
    const newDishes = [...dishes];
    newDishes[index] = value;
    setDishes(newDishes);
  };

  const handleSubmit = () => {
    const selectedDishes = dishes.filter((d) => d.trim() !== "");
    if (selectedDishes.length === 0) {
      setError("Please enter at least one dish name.");
      return;
    }
    setError(null);
    onDishesSelected(selectedDishes);
  };

  return (
    <div className="w-full animate-slide-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Menu Text
          </h3>
          <div className="h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto text-sm text-gray-600 whitespace-pre-wrap font-mono">
            {menuText}
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            What do you want to see?
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter up to 3 dish names from the menu.
          </p>
          <div className="space-y-4">
            {isLoadingDishes ? (
              <div className="text-center text-gray-500 py-10">
                <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-orange-500 mx-auto mb-2"></div>
                Extracting dishes...
              </div>
            ) : (
              dishes.map((dish, index) => (
                <AutocompleteInput
                  key={index}
                  value={dish}
                  onChange={(value) => handleDishChange(index, value)}
                  placeholder={`Dish ${index + 1}`}
                  suggestions={allDishes}
                />
              ))
            )}
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mt-4 text-sm text-center">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            className="mt-6 w-full flex items-center justify-center bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
          >
            <SparklesIcon />
            Visualize Dishes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishSelector;
