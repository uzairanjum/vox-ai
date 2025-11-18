"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import KnowledgeSourceTabs from "@/_components/knowledgebase/KnowledgeSourceTabs";

interface KnowledgeBase {
  id: string;
  name: string;
  type: number;
  summary?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  data?: any;
  faq?: any;
  file_uploads?: string;
}

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kbId = params.id as string;

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeBase();
  }, [kbId]);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/knowledgebase/${kbId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setKb(data.data);
      } else {
        throw new Error(data.error || "Failed to load knowledge base");
      }
    } catch (error) {
      console.error("Error loading knowledge base:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load knowledge base"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <LoadingSpinner className="h-6 w-6" />
          <span>Loading knowledge base...</span>
        </div>
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Knowledge Base</AlertTitle>
          <AlertDescription className="mt-2">
            {error || "Knowledge base not found"}
            <Button
              variant="outline"
              size="sm"
              onClick={loadKnowledgeBase}
              className="ml-2 h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">{kb?.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created at {kb?.created_at?.split("T")?.[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="px-7 py-5">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Knowledge Sources
            </CardTitle>
            <CardDescription>
              Add and manage information sources that enhance your bot’s ability
              to respond effectively.
            </CardDescription>
          </div>

          <Button
            className="mt-1"
            onClick={() =>
              router.push(
                `/dashboard/app/ai/knowledgebase/add-knowledge-base?id=${kb.id}`
              )
            }
          >
            + Add Source
          </Button>
        </div>

        {/* Tabs Section */}
        <KnowledgeSourceTabs kb={kb} />
      </Card>
    </>
  );
}
