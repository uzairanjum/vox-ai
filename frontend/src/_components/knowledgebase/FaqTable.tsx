"use client";

import { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Button } from "@/components/ui/button";

export default function FaqTable({ faqs = [], handleDeleteKBSource }: any) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="border rounded-lg overflow-hidden divide-y">
      {faqs?.length > 0 ? (
        faqs.map((faq: any) => {
          const isOpen = openFaq === faq.id;
          const question = faq?.data?.q || "Untitled question";
          const answer = faq?.data?.a || "";

          return (
            <div key={faq.id} className="px-4 py-3 transition-colors">
              {/* Question row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1">
                  {/* Q badge */}
                  <span
                    className="shrink-0 inline-flex items-center justify-center
                                   w-6 h-6 rounded-full bg-blue-100 text-blue-700
                                   text-xs font-semibold select-none"
                  >
                    Q
                  </span>

                  <div className="flex-1">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <p className="font-medium text-white">{question}</p>
                      {isOpen ? (
                        <Minus className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    {/* Answer section */}
                    {isOpen && answer && (
                      <div className="mt-3 flex items-start gap-3 text-sm text-gray-700">
                        {/* A badge */}
                        <span
                          className="shrink-0 inline-flex items-center justify-center
                                         w-6 h-6 rounded-full bg-green-100 text-green-700
                                         text-xs font-semibold select-none"
                        >
                          A
                        </span>

                        <div className="flex-1 flex items-center justify-between">
                          <p className="font-medium text-white">{answer}</p>

                          {/* Action buttons */}
                          <DeleteConfirmDialog
                            title="Remove FAQ from Knowledge Base"
                            description={`This FAQ entry will be permanently removed from the knowledge base. This action cannot be undone.`}
                            onConfirm={() =>
                              handleDeleteKBSource(faq.id, faq.kb_id)
                            }
                            trigger={
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-6 text-sm text-gray-500">
          No FAQs found
        </div>
      )}
    </div>
  );
}
