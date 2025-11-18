"use client";

import { Brain, Check, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

type Status = "completed" | "processing" | "pending";

interface Step {
  title: string;
  status: Status;
}

const initialSteps: Step[] = [
  { title: "Text Extraction", status: "pending" },
  { title: "Content Chunking", status: "pending" },
  { title: "Vector Embedding", status: "pending" },
  { title: "Index Creation", status: "pending" },
];

const getStatusIcon = (status: Status) => {
  switch (status) {
    case "completed":
      return <Check className="w-5 h-5 text-green-500" />;
    case "processing":
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    default:
      return <span className="text-gray-400 text-xs">Pending</span>;
  }
};

const ProcessingStep: React.FC<{ step: Step }> = ({ step }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-sm sm:text-base md:text-lg text-white">
      {step.title}
    </span>
    <div className="flex items-center">{getStatusIcon(step.status)}</div>
  </div>
);

interface AIProcessingProps {
  isUploading: boolean;
  onComplete?: () => void;
}

const AIProcessing: React.FC<AIProcessingProps> = ({
  isUploading,
  onComplete,
}) => {
  const [steps, setSteps] = useState<Step[]>(initialSteps);

  useEffect(() => {
    if (!isUploading) return;

    // Reset to pending when starting again
    setSteps(initialSteps.map((s) => ({ ...s, status: "pending" })));

    let index = 0;
    const interval = setInterval(() => {
      setSteps((prev) => {
        const updated = [...prev];

        // Complete previous step
        if (index > 0 && updated[index - 1]) {
          updated[index - 1].status = "completed";
        }

        // Start processing current step if valid
        if (updated[index]) {
          updated[index].status = "processing";
        }

        return updated;
      });

      index++;

      // Stop after all steps done
      if (index > initialSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
          onComplete?.();
        }, 1000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isUploading, onComplete]);

  return (
    <div className="flex-1 bg-[#171717] rounded-2xl border border-gray-700 p-6 mt-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex w-10 h-10 rounded-full bg-[#262626] justify-center items-center">
          <Brain className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white text-lg font-semibold leading-tight">
            AI Processing
          </h3>
          <span className="text-gray-400 text-sm">
            Analyzing content structure
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-6 space-y-3">
        {steps.map((step, i) => (
          <ProcessingStep key={i} step={step} />
        ))}
      </div>
    </div>
  );
};

export default AIProcessing;
