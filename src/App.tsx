import React, { useState, useCallback } from "react";
import { AppStep } from "./types/index";
import type { ContextualInfo, GeneratedDish } from "./types/index";
import {
  getMenuTextFromImage,
  getContextualInfo,
  generateImageForDish,
} from "./services/geminiService";

import MenuInput from "./components/MenuInput";
import DishSelector from "./components/DishSelector";
import Contextualizer from "./components/Contextualizer";
import ImageGallery from "./components/ImageGallery";
import Spinner from "./components/Spinner";
import Stepper from "./components/Stepper";

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.MENU_INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [menuText, setMenuText] = useState("");
  const [dishNames, setDishNames] = useState<string[]>([]);
  const [contextualInfo, setContextualInfo] = useState<ContextualInfo | null>(
    null
  );
  const [generatedDishes, setGeneratedDishes] = useState<GeneratedDish[]>([]);

  const handleError = (message: string) => {
    setError(message);
    setIsLoading(false);
  };

  const resetState = () => {
    setStep(AppStep.MENU_INPUT);
    setIsLoading(false);
    setError(null);
    setMenuText("");
    setDishNames([]);
    setContextualInfo(null);
    setGeneratedDishes([]);
  };

  const handleMenuProcessed = (text: string) => {
    setMenuText(text);
    setStep(AppStep.DISH_SELECTION);
    setIsLoading(false);
  };

  const handleDishesSelected = (dishes: string[]) => {
    setDishNames(dishes);
    setStep(AppStep.CONTEXT_INPUT);
  };

  const handleContextualize = useCallback(
    async (restaurantName: string | null) => {
      if (restaurantName) {
        try {
          const info = await getContextualInfo(restaurantName, dishNames);
          setContextualInfo(info);
          setStep(AppStep.CONTEXT_VALIDATION);
        } catch (err) {
          handleError(
            err instanceof Error
              ? `Context search failed: ${err.message}`
              : "An unknown error occurred."
          );
          setStep(AppStep.CONTEXT_INPUT);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User skipped context, proceed to generation
        setContextualInfo(null);
        generateAllImages(null);
      }
    },
    [dishNames]
  );

  const generateAllImages = useCallback(
    async (context: ContextualInfo | null) => {
      setStep(AppStep.GENERATING);
      setIsLoading(true);
      setError(null);
      try {
        const promises = dishNames.map((name) => {
          const dishCtx = context?.dishContexts.find(
            (c) => c.dishName === name
          );
          return generateImageForDish(
            name,
            menuText,
            context?.summary || null,
            dishCtx?.imageUrl || null
          );
        });
        const results = await Promise.all(promises);
        const finalDishes: GeneratedDish[] = dishNames.map((name, index) => ({
          name,
          imageBase64: results[index],
        }));
        setGeneratedDishes(finalDishes);
        setStep(AppStep.RESULTS);
      } catch (err) {
        handleError(
          err instanceof Error
            ? `Image generation failed: ${err.message}`
            : "An unknown error occurred."
        );
        setStep(AppStep.CONTEXT_INPUT); // Go back to a safe step
      } finally {
        setIsLoading(false);
      }
    },
    [dishNames, menuText]
  );

  const handleContextDecision = (restaurantName: string | null) => {
    const useContext = restaurantName !== null;
    generateAllImages(useContext ? contextualInfo : null);
  };

  const renderStep = () => {
    if (error) {
      return (
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            An Error Occurred
          </h2>
          <p className="text-gray-600 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
            {error}
          </p>
          <button
            onClick={resetState}
            className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
          >
            Start Over
          </button>
        </div>
      );
    }

    switch (step) {
      case AppStep.MENU_INPUT:
        return (
          <MenuInput
            onMenuProcessed={handleMenuProcessed}
            onProcessing={setIsLoading}
            processing={isLoading}
            extractTextFromImage={getMenuTextFromImage}
          />
        );
      case AppStep.DISH_SELECTION:
        return (
          <DishSelector
            menuText={menuText}
            onDishesSelected={handleDishesSelected}
          />
        );
      case AppStep.CONTEXT_INPUT:
      case AppStep.CONTEXT_VALIDATION:
        return (
          <Contextualizer
            dishes={dishNames}
            onContextualize={
              step === AppStep.CONTEXT_VALIDATION
                ? handleContextDecision
                : handleContextualize
            }
            onProcessing={setIsLoading}
            processing={isLoading}
            contextualInfo={contextualInfo}
          />
        );
      case AppStep.GENERATING:
        return <Spinner text="Generating your dishes..." />;
      case AppStep.RESULTS:
        return <ImageGallery dishes={generatedDishes} onReset={resetState} />;
      default:
        return <p>Invalid state</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
            See Before You <span className="text-red-600">Eat</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Turn menu text into delicious, realistic images. Stop guessing,
            start seeing.
          </p>
        </header>

        {step !== AppStep.RESULTS && <Stepper currentStep={step} />}

        <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white rounded-2xl shadow-xl border border-gray-100 min-h-[30rem] flex items-center justify-center">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default App;
