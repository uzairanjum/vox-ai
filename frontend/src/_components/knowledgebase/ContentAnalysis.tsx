import { GitGraph } from "lucide-react";
import React from "react";

const ProgressBar = ({ step, total }: { step: number; total: number }) => (
  <div className="w-full rounded-full bg-gray-600 h-2 overflow-hidden">
    <div
      className="bg-[#ef3e6d] h-2 rounded-full transition-all duration-500 ease-in-out"
      style={{ width: `${(step / total) * 100}%` }}
    />
  </div>
);

const ContentAnalysis: React.FC = () => {
  return (
    <div className="flex-1 bg-[#171717] rounded-2xl border border-gray-700 p-4 sm:p-6 md:p-8 mt-6 sm:mt-8 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex w-10 h-10 rounded-full bg-[#262626] justify-center items-center">
            <GitGraph className="h-5 w-5 sm:h-6 sm:w-6 " />
          </div>
          <div>
            <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold leading-tight">
              Content Analysis
            </h3>
            <span className="text-gray-400 text-xs sm:text-sm">
              Quality metrics & insights
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 sm:mt-8 space-y-6">
        {/* Readability */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm sm:text-base md:text-lg text-white">
              Readability Score
            </span>
            <span className="text-xs sm:text-sm text-gray-400">87/100</span>
          </div>
          <ProgressBar step={87} total={100} />
        </div>

        {/* Coverage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm sm:text-base md:text-lg text-white">
              Content Coverage
            </span>
            <span className="text-xs sm:text-sm text-gray-400">74/100</span>
          </div>
          <ProgressBar step={74} total={100} />
        </div>

        {/* Details */}
        <div className="space-y-1">
          <p className="text-gray-400 text-xs sm:text-sm">
            • 1,247 knowledge chunks created
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            • 89 key topics identified
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            • 156 potential FAQs detected
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalysis;
