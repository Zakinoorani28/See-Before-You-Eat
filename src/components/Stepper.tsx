import React from "react";
import { AppStep } from "../types/index";

interface StepperProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.MENU_INPUT, label: "Menu" },
  { id: AppStep.DISH_SELECTION, label: "Dishes" },
  { id: AppStep.CONTEXT_INPUT, label: "Context" },
  { id: AppStep.RESULTS, label: "Visualize" },
];

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const currentStepIndex = steps.findIndex((step) => {
    if (
      currentStep === AppStep.CONTEXT_VALIDATION ||
      currentStep === AppStep.GENERATING
    ) {
      return step.id === AppStep.CONTEXT_INPUT;
    }
    return step.id === currentStep;
  });

  return (
    <div className="w-full max-w-md mx-auto mb-12">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent =
            step.id === currentStep ||
            (currentStep === AppStep.CONTEXT_VALIDATION &&
              step.id === AppStep.CONTEXT_INPUT) ||
            (currentStep === AppStep.GENERATING &&
              step.id === AppStep.CONTEXT_INPUT);

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCurrent && (
                    <span className="w-3 h-3 bg-white rounded-full animate-ping absolute"></span>
                  )}
                  <span>{index + 1}</span>
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    isActive ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-auto border-t-2 transition-colors duration-300 mx-4 ${
                    isActive ? "border-orange-600" : "border-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
