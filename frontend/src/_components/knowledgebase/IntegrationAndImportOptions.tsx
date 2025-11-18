import React from "react";
import { Cloud, Database, Code2, Rss } from "lucide-react";

const sources = [
  {
    id: 1,
    title: "Google Drive",
    description: "Import files directly from Google Drive",
    action: "Connect Drive",
    icon: <Cloud className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 2,
    title: "Cloud",
    description: "Sync files from your Dropbox account",
    action: "Connect Dropbox",
    icon: <Cloud className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 3,
    title: "OneDrive",
    description: "Import from Microsoft OneDrive",
    action: "Connect OneDrive",
    icon: <Cloud className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 4,
    title: "Database",
    description: "Connect to SQL or NoSQL databases",
    action: "Setup Connection",
    icon: <Database className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 5,
    title: "API Integration",
    description: "Custom API endpoints and webhooks",
    action: "Configure API",
    icon: <Code2 className="w-8 h-8 text-gray-300" />,
  },
  {
    id: 6,
    title: "RSS Feeds",
    description: "Monitor and import RSS content",
    action: "Add Feed",
    icon: <Rss className="w-8 h-8 text-gray-300" />,
  },
];

const IntegrationAndImportOptions = () => {
  return (
    <div className="w-full bg-[#171717]  rounded-2xl border border-gray-700 p-6 md:p-8 mt-8 shadow-lg">
      {/* Top row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-white text-lg md:text-xl font-semibold leading-tight text-center md:text-left">
          Integration & Import Options
        </h3>
      </div>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div
            key={src.id}
            className="bg-[#171717] border border-gray-700 rounded-xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#ef3e6d] hover:bg-[#150d0e] cursor-pointer"
          >
            {/* Icon */}
            <div className="flex w-14 h-14 rounded-lg bg-[#262626] justify-center items-center mb-4">
              {src.icon}
            </div>

            {/* Title */}
            <h3 className="text-white text-lg font-semibold">{src.title}</h3>
            <p className="mt-1 text-gray-400 text-sm text-center">
              {src.description}
            </p>

            {/* Action Button */}
            {/* Action Button */}
            <div className="mt-4 w-full">
              <button className="w-full py-2 bg-[#262626] text-gray-200 text-sm rounded hover:bg-[#333] transition cursor-pointer">
                {src.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationAndImportOptions;
