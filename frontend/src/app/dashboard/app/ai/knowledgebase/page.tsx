"use client";

import { KBTable } from "@/_components/knowledgebase/KBTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay, // 👈 import overlay
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function KnowledgeBasePage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description.trim());

    try {
      const res = await fetch("/api/ai/knowledgebase/add-kb", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Unknown server error");
        return;
      }

      toast.success("Knowledge base created ✅");
      router.push(`/dashboard/app/ai/knowledgebase/${json?.data?.id}`);
      setName("");
      setDescription("");
      setTableKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setOpen(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-[#ef3d6d] bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your AI training data and resources
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#ef3d6d] hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" /> Add Knowledge Base
            </Button>
          </DialogTrigger>

          <DialogOverlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Knowledge Base</DialogTitle>
              <DialogDescription>
                Provide a name and optional description for your new knowledge
                base.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="kb-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="kb-name"
                  placeholder="My KB"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-3">
                <Label htmlFor="kb-desc" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="kb-desc"
                  placeholder="Optional"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  className="col-span-3"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="bg-[#ef3d6d] text-white"
              >
                {loading ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <KBTable key={tableKey} showActions />
    </div>
  );
}
