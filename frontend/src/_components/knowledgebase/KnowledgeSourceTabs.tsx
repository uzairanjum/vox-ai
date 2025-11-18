"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FileTable from "./FileTable";
import UrlTable from "./UrlTable";
import FaqTable from "./FaqTable";
import { FileText, MessageSquare, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type SourceKey = "files" | "faqs" | "webUrls";

export default function KnowledgeSourceTabs({ kb }: { kb: any }) {
  const router = useRouter();

  // --- Local reactive copy ---
  const [sources, setSources] = useState(kb?.sources || {});
  const [activeTab, setActiveTab] = useState("all");

  const counts: Record<SourceKey, number> = {
    files: sources?.files?.data?.length || 0,
    faqs: sources?.faqs?.data?.length || 0,
    webUrls: sources?.webUrls?.data?.length || 0,
  };

  const cards: {
    key: SourceKey;
    label: string;
    icon: React.ReactNode;
    tab: SourceKey;
  }[] = [
    {
      key: "files",
      label: "Files",
      icon: <FileText className="w-6 h-6" />,
      tab: "files",
    },
    {
      key: "faqs",
      label: "FAQs",
      icon: <MessageSquare className="w-6 h-6" />,
      tab: "faqs",
    },
    {
      key: "webUrls",
      label: "Web URLs",
      icon: <ExternalLink className="w-6 h-6" />,
      tab: "webUrls",
    },
  ];

  function gotoTab(tab: string) {
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  }

  const handleDeleteKBSource = async (
    srcId: string,
    kbId: string,
    type?: "files" | "webUrls" | "faqs"
  ) => {
    try {
      const res = await fetch(`/api/ai/knowledgebase/delete-source/${srcId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kbId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete source");

      // ✅ Optimistically remove deleted source from UI
      if (type) {
        setSources((prev: any) => ({
          ...prev,
          [type]: {
            ...prev[type],
            data: prev[type]?.data?.filter((item: any) => item.id !== srcId),
          },
        }));
      }

      toast.success("Source deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Error deleting source");
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full mt-4"
    >
      <TabsList className="grid grid-cols-4 w-full sm:w-auto">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="webUrls">Web URLs</TabsTrigger>
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.key}
              onClick={() => gotoTab(c.tab)}
              className="border rounded-lg p-5 hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white">{c.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {counts[c.key]}
                </p>
              </div>
              <div className="text-gray-400">{c.icon}</div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="files" className="mt-4">
        <FileTable
          files={sources?.files?.data}
          handleDeleteKBSource={(id: string, kbId: string) =>
            handleDeleteKBSource(id, kbId, "files")
          }
        />
      </TabsContent>

      <TabsContent value="webUrls" className="mt-4">
        <UrlTable
          urls={sources?.webUrls?.data}
          handleDeleteKBSource={(id: string, kbId: string) =>
            handleDeleteKBSource(id, kbId, "webUrls")
          }
        />
      </TabsContent>

      <TabsContent value="faqs" className="mt-4">
        <FaqTable
          faqs={sources?.faqs?.data}
          handleDeleteKBSource={(id: string, kbId: string) =>
            handleDeleteKBSource(id, kbId, "faqs")
          }
        />
      </TabsContent>
    </Tabs>
  );
}
