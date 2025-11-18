"use client";

import React, { FC, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface FAQGeneratorProps {
  setShowFaqInput: (show: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showMessage: (type: "success" | "error", message: string) => void;
}

const FAQGenerator: FC<FAQGeneratorProps> = ({
  setShowFaqInput,
  loading,
  setLoading,
  showMessage,
}) => {
  const [faqMode, setFaqMode] = useState<"manual" | "auto">("manual");
  const [faqs, setFaqs] = useState<FAQItem[]>([
    { question: "", answer: "", category: "general" },
  ]);
  const [autoGenerateOptions, setAutoGenerateOptions] = useState({
    numberOfQuestions: 5,
    sourceContent: "",
  });

  const handleFaqGeneration = async () => {
    try {
      setLoading(true);

      const faqData = {
        userId: "user-123", // Replace with actual user ID
        mode: faqMode,
        faqs:
          faqMode === "manual"
            ? faqs.filter((faq) => faq.question.trim() && faq.answer.trim())
            : [],
        options:
          faqMode === "auto"
            ? {
                autoGenerate: true,
                numberOfQuestions: autoGenerateOptions.numberOfQuestions,
                ...(autoGenerateOptions.sourceContent && {
                  sourceContent: autoGenerateOptions.sourceContent,
                }),
              }
            : undefined,
      };

      const res = await fetch("/api/ai/knowledgebase/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showMessage("success", data.data.message);
        setShowFaqInput(false);
        setFaqs([{ question: "", answer: "", category: "general" }]);
        setAutoGenerateOptions({ numberOfQuestions: 5, sourceContent: "" });
      } else {
        showMessage("error", data.error || "FAQ generation failed");
      }
    } catch (err) {
      showMessage("error", "FAQ generation failed - network error");
    } finally {
      setLoading(false);
    }
  };

  // Add new FAQ field
  const addFaqField = () => {
    setFaqs([...faqs, { question: "", answer: "", category: "general" }]);
  };

  // Remove FAQ field
  const removeFaqField = (index: number) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((_, i) => i !== index));
    }
  };

  // Update FAQ field
  const updateFaqField = (
    index: number,
    field: keyof FAQItem,
    value: string
  ) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };

  const handleSubmitFaq = (e: React.FormEvent) => {
    e.preventDefault();
    handleFaqGeneration();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-6 w-full max-w-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white text-lg font-semibold">FAQ Generator</h3>
          <button
            onClick={() => setShowFaqInput(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitFaq} className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setFaqMode("manual")}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                faqMode === "manual"
                  ? "bg-[#ef3e6d] text-white"
                  : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setFaqMode("auto")}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                faqMode === "auto"
                  ? "bg-[#ef3e6d] text-white"
                  : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              AI Generate
            </button>
          </div>

          {faqMode === "manual" ? (
            /* Manual FAQ Entry */
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-600"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">FAQ #{index + 1}</h4>
                    {faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFaqField(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) =>
                        updateFaqField(index, "question", e.target.value)
                      }
                      placeholder="Enter question..."
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d]"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) =>
                        updateFaqField(index, "answer", e.target.value)
                      }
                      placeholder="Enter answer..."
                      rows={3}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d] resize-none"
                    />
                    <select
                      value={faq.category}
                      onChange={(e) =>
                        updateFaqField(index, "category", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded text-white focus:outline-none focus:border-[#ef3e6d]"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="support">Support</option>
                      <option value="features">Features</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addFaqField}
                className="flex items-center gap-2 text-[#ef3e6d] hover:text-[#d8355d] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another FAQ
              </button>
            </div>
          ) : (
            /* Auto FAQ Generation */
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Number of Questions to Generate
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={autoGenerateOptions.numberOfQuestions}
                  onChange={(e) =>
                    setAutoGenerateOptions((prev) => ({
                      ...prev,
                      numberOfQuestions: parseInt(e.target.value) || 5,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded text-white focus:outline-none focus:border-[#ef3e6d]"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Source Content (Optional)
                </label>
                <textarea
                  value={autoGenerateOptions.sourceContent}
                  onChange={(e) =>
                    setAutoGenerateOptions((prev) => ({
                      ...prev,
                      sourceContent: e.target.value,
                    }))
                  }
                  placeholder="Paste content here to generate FAQs from specific text. Leave empty to use your knowledge base content."
                  rows={4}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-[#ef3e6d] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  If left empty, the AI will generate FAQs based on your
                  existing knowledge base content.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowFaqInput(false)}
              className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (faqMode === "manual" &&
                  !faqs.some((f) => f.question.trim() && f.answer.trim()))
              }
              className="flex-1 px-4 py-2 bg-[#ef3e6d] text-white rounded-lg hover:bg-[#d8355d] disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Generating..."
                : faqMode === "auto"
                ? "Generate FAQs"
                : "Add FAQs"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FAQGenerator;
