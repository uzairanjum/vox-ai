"use client";

import React from "react";
import { Brain } from "lucide-react";

const CustomerSupportAgent = () => {
  return (
    <div className="w-full bg-[#171717] rounded-2xl border border-gray-700 p-6 md:p-8 mt-8 shadow-lg">
      {/* top row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex justify-center items-center space-x-4">
          <div className="flex w-10 h-10 rounded-full bg-[#262626] justify-center items-center">
            <Brain className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-white text-lg font-semibold leading-tight">
              Customer Support Agent
            </h3>
            <span className="text-gray-400 text-xs md:text-sm">
              Last updated: January 15, 2025
            </span>
          </div>
        </div>

        {/* big number */}
        <div className="text-right">
          <div className="text-2xl md:text-3xl font-bold text-white">1,247</div>
          <span className="text-gray-400 text-xs md:text-sm">
            Knowledge Items
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 mt-8 text-center">
        <div>
          <div className="text-lg md:text-xl font-semibold text-white">89</div>
          <div className="text-sm text-gray-400">Documents</div>
        </div>
        <div>
          <div className="text-lg md:text-xl font-semibold text-white">156</div>
          <div className="text-sm text-gray-400">Audio Files</div>
        </div>
        <div>
          <div className="text-lg md:text-xl font-semibold text-white">78</div>
          <div className="text-sm text-gray-400">Web Pages</div>
        </div>
        <div>
          <div className="text-lg md:text-xl font-semibold text-white">342</div>
          <div className="text-sm text-gray-400">FAQs</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportAgent;
