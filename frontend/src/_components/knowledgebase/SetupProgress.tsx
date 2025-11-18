import { Check } from "lucide-react";
import React from "react";

const steps = [
  { number: 1, text: "Setup", isComplete: true },
  { number: 2, text: "Profile", isComplete: true },
  { number: 3, text: "Content", isComplete: false },
  { number: 4, text: "FAQs", isComplete: false },
  { number: 5, text: "Training", isComplete: false },
  { number: 6, text: "Testing", isComplete: false },
  { number: 7, text: "Deploy", isComplete: false },
];

const SetupProgress = () => {
  /* helper for the progress bar */
  const ProgressBar = ({ step, total }: { step: number; total: number }) => (
    <div className="w-full rounded-full bg-gray-500 h-2 overflow-hidden">
      <div
        className="bg-[#ef3e6d] h-2 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  );

  const currentStep = 3;

  return (
    <div className="w-full bg-[#171717]  rounded-2xl border border-gray-700 p-6 md:p-8 mt-8 shadow-lg">
      {/* Top row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-white text-lg md:text-xl font-semibold leading-tight text-center md:text-left">
          Setup Progress
        </h3>

        {/* Right side text */}
        <span className="text-gray-400 text-sm text-center md:text-right">
          Step {currentStep} of {steps.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="my-6 md:my-10">
        <ProgressBar step={currentStep} total={steps.length} />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-x-6 gap-y-8 mt-6 md:mt-10 text-center">
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep;
          return (
            <div
              key={index}
              className="flex flex-col justify-center items-center"
            >
              <div
                className={`flex w-8 h-8 md:w-10 md:h-10 rounded-full justify-center items-center border transition-all duration-300
                ${
                  step.isComplete
                    ? "bg-[#ef3e6d] text-white"
                    : isActive
                    ? "bg-[#150d0e] border-[#ef3e6d] text-gray-200"
                    : "bg-[#262626] border-[#2F3A4C] text-gray-400"
                }`}
              >
                {step.isComplete ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <span className="text-xs md:text-sm font-medium">
                    {step.number}
                  </span>
                )}
              </div>

              <div className="text-[10px] sm:text-xs md:text-sm mt-2 text-gray-400 font-medium">
                {step.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SetupProgress;
