"use client";
import React, { useState } from "react";

import ChooseYouContentSource, {
  Faq,
} from "@/_components/knowledgebase/ChooseYouContentSource";

import BottomButtons from "@/_components/knowledgebase/BottomButtons";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const AddKnowledgeBasePage = () => {
  const [training, setTraining] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [websiteLinks, setWebsiteLinks] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const searchParams = useSearchParams();
  const kbId = searchParams.get("id");

  /* handlers that already exist */
  const handleFilesSelected = (files: File[]) => setSelectedFiles(files);

  const handleCrawlerLink = (link: string) => {
    setWebsiteLinks((prev) => [...prev, link]); // add to array
  };

  const handleFaqsChange = (updated: Faq[]) => setFaqs(updated); // live stream

  const handleAddKnowledgeBaseSources = async () => {
    /* ---------- build multipart body ---------- */
    setLoading(true);
    const fd = new FormData();

    fd.append("kbId", kbId || "");

    if (websiteLinks.length) fd.append("urls", JSON.stringify(websiteLinks));
    if (faqs.length) fd.append("faqs", JSON.stringify(faqs));
    selectedFiles.forEach((f) => fd.append("files", f));

    try {
      const res = await fetch("/api/ai/knowledgebase/add-sources", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Unknown error");
        setLoading(false);
        return;
      }

      // Start training UI state
      setTraining(true); // 👈 new state variable
      setLoading(false);

      // Wait at least 10 seconds to simulate agent training
      setTimeout(() => {
        toast.success("Your AI agent is ready 🎯");
        router.push("/dashboard/app/ai/knowledgebase");
      }, 10000);
    } catch (err: any) {
      toast.error(err.message || "KB creation failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-10 lg:px-16">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center">
        Build Your AI Knowledge Base
      </h1>
      <p className="mt-3 text-sm md:text-base text-gray-300 text-center max-w-2xl mx-auto leading-relaxed">
        Transform your content into intelligent conversations. Upload files,
        import data, and train your AI agent with multiple content sources in a
        few simple steps.
      </p>

      {training && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 border-4 border-[#ef3d6d] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-lg font-medium text-white text-center">
            Your AI agent is training on new sources...
          </p>
        </div>
      )}

      {/* Chooose Your Content Source */}
      <ChooseYouContentSource
        onFilesSelected={handleFilesSelected}
        onCrawlerLink={handleCrawlerLink}
        onFaqsSubmit={(f) => setFaqs(f)} // batch callback (when modal saves)
        onFaqsChange={handleFaqsChange} // live callback (on every edit)
      />

      {/* Bottom Buttons */}
      <BottomButtons
        handleAddKnowledgeBaseSources={handleAddKnowledgeBaseSources}
        loading={loading}
      />
    </div>
  );
};

export default AddKnowledgeBasePage;
