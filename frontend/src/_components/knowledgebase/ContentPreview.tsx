import { ArrowRight, Check, Edit } from "lucide-react";
import React from "react";

const content = [
  {
    id: 1,
    title: "Product Return Policy",
    source: "Product Manual v2.1.pdf",
    content:
      "Customers can return products within 30 days of purchase. Items must be in original condition with all packaging and accessories. Refunds are processed within 5-7 business days after we receive the returned item.",
    confidenceLevel: "High",
    chunkInfo: "#1-15",
    wordCount: "156",
  },
  {
    id: 2,
    title: "Customer Support Hours",
    source: "Customer Guidelines.docx",
    content:
      "Our customer support team is available Monday through Friday from 9 AM to 6 PM EST. For urgent issues outside business hours, customers can submit a ticket through our online portal or call our emergency hotline.",
    confidenceLevel: "Medium",
    chunkInfo: "#18-28",
    wordCount: "89",
  },
  {
    id: 3,
    title: "Account Setup Process",
    source: "FAQ Database.txt",
    content:
      "Setting up a new account takes just a few minutes. Users need to provide their email, create a password, and verify their email address. Additional profile information can be added later through the settings menu.",
    confidenceLevel: "High",
    chunkInfo: "#29-42",
    wordCount: "67",
  },
];

const ContentPreview = () => {
  return (
    <div className="w-full mx-auto p-4 sm:p-6 lg:p-8 bg-[#171717] rounded-2xl border border-gray-700 shadow-md mt-8">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-white text-xl sm:text-2xl font-semibold leading-tight">
          Content Preview
        </p>

        <div className="flex flex-wrap gap-3">
          <button className="w-full sm:w-36 lg:w-40 h-10 bg-[#262626] rounded-lg text-sm text-white hover:bg-gray-700 transition">
            Edit Content
          </button>
          <button className="w-full sm:w-36 lg:w-40 h-10 bg-[#262626] rounded-lg text-sm text-white hover:bg-gray-700 transition">
            Approve All
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {["342", "128", "56"].map((val, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-center items-center p-5 bg-[#262626] rounded-lg text-center"
          >
            <p className="text-2xl sm:text-3xl font-semibold">{val}</p>
            <p className="text-sm sm:text-base text-gray-400">
              Processed Chunks
            </p>
          </div>
        ))}
      </div>

      {/* Content rows */}
      {content.map((item, index) => (
        <div
          key={index}
          className="w-full bg-[#171717] rounded-2xl border border-gray-700 p-5 sm:p-6 lg:p-8 mt-6 shadow-lg"
        >
          {/* top row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex w-10 h-10 rounded-full bg-[#262626] justify-center items-center text-white text-sm font-medium">
                {item.id}
              </div>

              <div>
                <h3 className="text-white text-base sm:text-lg font-semibold leading-tight">
                  {item.title}
                </h3>
                <span className="text-gray-400 text-xs sm:text-sm">
                  From: {item.source}
                </span>
              </div>
            </div>

            {/* Right icon */}
            <Edit className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer transition" />
          </div>

          {/* Description */}
          <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-gray-300 leading-relaxed">
            {item.content}
          </p>

          {/* Footer */}
          <div className="flex flex-wrap gap-3 sm:gap-5 mt-4 sm:mt-5 text-gray-400">
            <div className="flex items-center text-xs sm:text-sm">
              <div className="flex w-3 h-3 rounded-full bg-green-900 justify-center items-center">
                <Check className="w-2 h-2 text-green-400" />
              </div>
              <p className="ml-2">{item.confidenceLevel} Confidence</p>
            </div>
            <p className="text-xs sm:text-sm">Chunk# {item.chunkInfo}</p>
            <p className="text-xs sm:text-sm">{item.wordCount} words</p>
          </div>
        </div>
      ))}

      {/* View all */}
      <div className="mt-6 flex justify-center items-center space-x-2 text-sm sm:text-base text-gray-400 hover:text-white cursor-pointer transition">
        <p>View All 342 Content Chunks</p>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
    </div>
  );
};

export default ContentPreview;
