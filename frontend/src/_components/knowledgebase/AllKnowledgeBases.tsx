import { KnowledgeBase } from "@/utils/database/knowledgebase";
import {
  Calendar,
  Database,
  FileText,
  Globe,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface AllKnowledgeBasesProps {
  selectedKBIds?: string[]; // optional so it works for both add & edit
  onSelectionChange: (ids: string[]) => void;
}

const AllKnowledgeBases: React.FC<AllKnowledgeBasesProps> = ({
  selectedKBIds = [], // ✅ Default to empty array
  onSelectionChange,
}) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loadingKB, setLoadingKB] = useState(false);

  useEffect(() => {
    const loadKnowledgeBases = async () => {
      try {
        setLoadingKB(true);
        const response = await fetch("/api/ai/knowledgebase");
        const data = await response.json();

        if (data.success) {
          const kbData = Array.isArray(data.data) ? data.data : [];
          setKnowledgeBases(kbData);
        } else {
          console.error("Failed to load knowledge bases:", data.error);
        }
      } catch (error) {
        console.error("Error loading knowledge bases:", error);
        setKnowledgeBases([]);
      } finally {
        setLoadingKB(false);
      }
    };

    loadKnowledgeBases();
  }, []);

  const getKBTypeInfo = (type: number) => {
    const types = {
      1: {
        label: "Conversation",
        icon: MessageCircle,
        color: "text-blue-600 bg-blue-100 border-blue-200",
      },
      2: {
        label: "File Upload",
        icon: FileText,
        color: "text-green-600 bg-green-100 border-green-200",
      },
      3: {
        label: "FAQ",
        icon: MessageSquare,
        color: "text-purple-600 bg-purple-100 border-purple-200",
      },
      4: {
        label: "Web Scraper",
        icon: Globe,
        color: "text-orange-600 bg-orange-100 border-orange-200",
      },
    };
    return (
      types[type as keyof typeof types] || {
        label: "Unknown",
        icon: Database,
        color: "text-gray-600 bg-gray-100 border-gray-200",
      }
    );
  };

  const handleToggle = (id: string) => {
    // ✅ Always use array spread safely
    if (selectedKBIds.includes(id)) {
      onSelectionChange(selectedKBIds.filter((kbId) => kbId !== id));
    } else {
      onSelectionChange([...selectedKBIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      {loadingKB ? (
        <p className="text-sm text-muted-foreground">
          Loading knowledge bases...
        </p>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">
            Showing {knowledgeBases.length} knowledge sources
          </div>

          <div className="grid gap-2 max-h-80 overflow-y-auto rounded-lg px-1">
            {knowledgeBases.map((kb) => {
              // const typeInfo = getKBTypeInfo(kb.type);
              const isSelected = selectedKBIds.includes(kb.id);

              return (
                <Card
                  key={kb.id}
                  onClick={() => handleToggle(kb.id)}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    isSelected ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-3 flex items-start space-x-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(kb.id)}
                      className="mt-1 scale-90"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-800 truncate">
                            {kb.name}
                          </h4>
                          {/* {kb.summary && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                              {kb.summary}
                            </p>
                          )} */}
                        </div>

                        {/* <Badge
                          variant="outline"
                          className={`text-[0.65rem] ${typeInfo.color} border-current px-1.5 py-0.5`}
                        >
                          <typeInfo.icon className="w-2.5 h-2.5 mr-0.5" />
                          {typeInfo.label}
                        </Badge> */}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[0.65rem] text-gray-500">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(kb.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AllKnowledgeBases;
