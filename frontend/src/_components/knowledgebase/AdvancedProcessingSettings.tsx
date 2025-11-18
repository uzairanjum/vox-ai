import React, { useState, ChangeEvent } from "react";

// Types
type ChunkStrategy = "fixed" | "sliding" | "semantic";
type EmbeddingModel =
  | "text-embedding-ada-002"
  | "all-MiniLM-L6-v2"
  | "sentence-transformer"
  | "custom";
type ProcessingPriority = "low" | "normal" | "high" | "realtime";

interface LanguageOpts {
  lowercase: boolean;
  removeStopwords: boolean;
  stemming: boolean;
}

interface ContentExclusions {
  profanity: boolean;
  pii: boolean;
  shortParagraphs: boolean;
}

// Config constants
const MARK_COLOR = "#ef3e6d";
const BG_TRACK = "#2b2b2b";

const AdvancedProcessingSettings: React.FC = () => {
  // Left side state
  const [chunkStrategy, setChunkStrategy] = useState<ChunkStrategy>("fixed");
  const [embeddingModel, setEmbeddingModel] = useState<EmbeddingModel>(
    "text-embedding-ada-002"
  );
  const [languageOpts, setLanguageOpts] = useState<LanguageOpts>({
    lowercase: true,
    removeStopwords: false,
    stemming: false,
  });

  // Right side state
  const [minChunkSize, setMinChunkSize] = useState<number>(50);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(75);
  const [contentExclusions, setContentExclusions] = useState<ContentExclusions>(
    {
      profanity: false,
      pii: true,
      shortParagraphs: false,
    }
  );
  const [priority, setPriority] = useState<ProcessingPriority>("normal");

  // Helpers
  const rangeBg = (
    value: number,
    min: number,
    max: number
  ): React.CSSProperties => {
    const pct = ((value - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(90deg, ${MARK_COLOR} ${pct}%, ${BG_TRACK} ${pct}%)`,
    };
  };

  const toggleLanguageOpt = (key: keyof LanguageOpts) =>
    setLanguageOpts((s) => ({ ...s, [key]: !s[key] }));

  const toggleExclusion = (key: keyof ContentExclusions) =>
    setContentExclusions((s) => ({ ...s, [key]: !s[key] }));

  const handleRangeChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setter(Number(e.target.value));

  return (
    <div className="w-full bg-[#171717] rounded-2xl border border-gray-700 p-6 md:p-8 mt-8 shadow-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-white text-lg md:text-xl font-semibold leading-tight">
          Advanced Processing Settings
        </h3>
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Content Chunking Strategy */}
          <div className="p-4 sm:p-6 bg-[#151515] rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Content Chunking Strategy
            </label>
            <div className="space-y-2">
              {[
                {
                  id: "fixed" as ChunkStrategy,
                  title: "Fixed-size chunking",
                },
                {
                  id: "sliding" as ChunkStrategy,
                  title: "Overlapping sliding window",
                },
                {
                  id: "semantic" as ChunkStrategy,
                  title: "Semantic chunking",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer `}
                >
                  <input
                    type="radio"
                    name="chunkStrategy"
                    checked={chunkStrategy === opt.id}
                    onChange={() => setChunkStrategy(opt.id)}
                    className="sr-only"
                    aria-labelledby={`chunk-${opt.id}-title`}
                  />
                  <span
                    className={`w-4 h-4 flex-shrink-0 rounded-full border flex items-center justify-center ${
                      chunkStrategy === opt.id
                        ? "bg-[#ef3e6d] border-[#ef3e6d]"
                        : "border-gray-600"
                    }`}
                  />
                  <div>
                    <div
                      id={`chunk-${opt.id}-title`}
                      className="text-sm font-medium text-gray-100"
                    >
                      {opt.title}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Embedding Model */}
          <div className="p-4 sm:p-6 bg-[#151515] rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Embedding Model
            </label>
            <select
              value={embeddingModel}
              onChange={(e) =>
                setEmbeddingModel(e.target.value as EmbeddingModel)
              }
              className="w-full bg-[#171717] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ef3e6d]"
            >
              <option value="text-embedding-ada-002">
                text-embedding-ada-002
              </option>
              <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2</option>
              <option value="sentence-transformer">sentence-transformer</option>
              <option value="custom">Custom (upload)</option>
            </select>
          </div>

          {/* Language Processing */}
          <div className="p-4 sm:p-6 bg-[#151515] rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Language Processing
            </label>
            {(
              [
                [
                  "lowercase",
                  "Lowercase text",
                  "Normalize tokens to lowercase.",
                ],
                [
                  "removeStopwords",
                  "Remove stopwords",
                  "Filter out common filler words.",
                ],
                ["stemming", "Stemming", "Reduce words to their root form."],
              ] as [keyof LanguageOpts, string, string][]
            ).map(([key, title, desc]) => (
              <label
                key={key}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={languageOpts[key]}
                  onChange={() => toggleLanguageOpt(key)}
                  className="w-4 h-4 rounded border-gray-600 text-[#ef3e6d] accent-[#ef3e6d]"
                />
                <div>
                  <div className="text-sm text-gray-100">{title}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Quality Filters */}
          <div className="p-4 sm:p-6 bg-[#151515] rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Quality Filters
            </label>
            {/* Min Chunk Size */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-100">
                  Minimum Chunk Size (words)
                </span>
                <span className="text-xs text-gray-400">
                  {minChunkSize} words
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={1}
                value={minChunkSize}
                onChange={handleRangeChange(setMinChunkSize)}
                style={rangeBg(minChunkSize, 10, 500)}
                className="w-full mt-3 h-2 rounded-lg appearance-none
             [&::-webkit-slider-thumb]:appearance-none 
             [&::-webkit-slider-thumb]:w-4 
             [&::-webkit-slider-thumb]:h-4 
             [&::-webkit-slider-thumb]:rounded-full 
             [&::-webkit-slider-thumb]:bg-[#ef3e6d] 
             [&::-webkit-slider-thumb]:cursor-pointer 
             [&::-moz-range-thumb]:w-4 
             [&::-moz-range-thumb]:h-4 
             [&::-moz-range-thumb]:rounded-full 
             [&::-moz-range-thumb]:bg-[#ef3e6d] 
             [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-100">
                  Confidence Threshold
                </span>
                <span className="text-xs text-gray-400">
                  {confidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={confidenceThreshold}
                onChange={handleRangeChange(setConfidenceThreshold)}
                style={rangeBg(confidenceThreshold, 0, 100)}
                className="w-full mt-3 h-2 rounded-lg appearance-none
             [&::-webkit-slider-thumb]:appearance-none 
             [&::-webkit-slider-thumb]:w-4 
             [&::-webkit-slider-thumb]:h-4 
             [&::-webkit-slider-thumb]:rounded-full 
             [&::-webkit-slider-thumb]:bg-[#ef3e6d] 
             [&::-webkit-slider-thumb]:cursor-pointer 
             [&::-moz-range-thumb]:w-4 
             [&::-moz-range-thumb]:h-4 
             [&::-moz-range-thumb]:rounded-full 
             [&::-moz-range-thumb]:bg-[#ef3e6d] 
             [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Content Exclusions */}
          <div className="p-4 sm:p-6 bg-[#151515] rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Content Exclusions
            </label>
            {(
              [
                [
                  "profanity",
                  "Profanity",
                  "Exclude explicit language from training.",
                ],
                [
                  "pii",
                  "Emails & PII",
                  "Remove personal data like emails, phones.",
                ],
                [
                  "shortParagraphs",
                  "Short paragraphs",
                  "Exclude very short content.",
                ],
              ] as [keyof ContentExclusions, string, string][]
            ).map(([key, title, desc]) => (
              <label
                key={key}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={contentExclusions[key]}
                  onChange={() => toggleExclusion(key)}
                  className="w-4 h-4 rounded border-gray-600 text-[#ef3e6d] accent-[#ef3e6d]"
                />
                <div>
                  <div className="text-sm text-gray-100">{title}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Processing Priority */}
          <div className="p-4 sm:p-6 bg-[#151515] rounded-xl border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Processing Priority
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as ProcessingPriority)
              }
              className="w-full bg-[#171717] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ef3e6d]"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="realtime">Real-time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedProcessingSettings;
