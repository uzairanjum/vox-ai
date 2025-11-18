// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Bot,
  Edit,
  Save,
  ArrowLeft,
  TestTube,
  Activity,
  Calendar,
  User,
  MessageSquare,
  Settings,
  Trash2,
  MessageCircle,
  FileText,
  Globe,
  CheckCircle,
  Database,
} from "lucide-react";
import { getClientGhlToken } from "@/utils/ghl/tokenUtils";
import AddTagsModal from "@/components/ai-agent/AddTagsModal";
import AllKnowledgeBases from "@/_components/knowledgebase/AllKnowledgeBases";
import { KBTable } from "@/_components/knowledgebase/KBTable";

interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  agentType: string;
  personality: string;
  intent: string;
  additionalInformation: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  channels: string[];
  knowledgeBases: { type: number; provider_type_sub_id: string }[];
}

const AGENT_TYPES = {
  query: {
    label: "Query Agent",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  suggestions: {
    label: "Suggestions Agent",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  response: {
    label: "Response Agent",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AgentDetailClientPage params={params} />;
}

function AgentDetailClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentId, setAgentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMessageTypes, setSelectedMessageTypes] = useState<string[]>(
    []
  );
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    personality: "",
    intent: "",
    additionalInformation: "",
    isActive: true,
  });
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [ghlTags, setGhlTags] = useState<
    { id: string; name: string; locationId: string }[]
  >([]);
  const [tag, setTag] = useState<string>(""); // instead of tags[]
  const [newTag, setNewTag] = useState("");
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>(
    agent?.knowledgeBases?.map((kb) => kb.id) || []
  );

  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      setTag(newTag.trim());
      setNewTag("");
    }
  };

  const handleDeleteTag = () => {
    setTag("");
  };

  // Helper function to convert agent type number to string
  const getAgentTypeString = (type: number): string => {
    switch (type) {
      case 1:
        return "query";
      case 2:
        return "suggestions";
      case 3:
        return "response";
      default:
        return "query";
    }
  };

  // Helper function to convert channels object to array
  const convertChannelsObjectToArray = (
    channels: Record<string, { enabled: boolean; settings?: any }>
  ): string[] => {
    if (!channels) return [];

    const channelMappings = {
      sms: "SMS",
      email: "Email",
      whatsapp: "WhatsApp",
      facebook: "FB",
      instagram: "IG",
      web: "Live_Chat",
      gmb: "Custom",
    };

    return Object.entries(channels)
      .filter(
        ([backendValue, config]) =>
          config.enabled &&
          channelMappings[backendValue as keyof typeof channelMappings]
      )
      .map(
        ([backendValue]) =>
          channelMappings[backendValue as keyof typeof channelMappings]
      );
  };

  // Helper function to convert array to channels object
  // Helper function to convert array to channels object
  const convertArrayToChannelsObject = (
    channelsArray: string[]
  ): Record<string, { enabled: boolean; settings?: any }> => {
    const channelsObject: Record<string, { enabled: boolean; settings?: any }> =
      {};

    // Map frontend values to backend values
    const channelMappings = {
      SMS: "sms",
      Email: "email",
      WhatsApp: "whatsapp",
      FB: "facebook",
      IG: "instagram",
      Live_Chat: "web",
      Custom: "gmb",
    };

    // Initialize all channels as disabled
    const allChannels = [
      "sms",
      "facebook",
      "instagram",
      "web",
      "whatsapp",
      "email",
      "gmb",
    ];
    allChannels.forEach((channel) => {
      channelsObject[channel] = {
        enabled: false,
        settings: {},
      };
    });

    // Enable only the selected channels
    channelsArray.forEach((frontendValue) => {
      const backendValue =
        channelMappings[frontendValue as keyof typeof channelMappings];
      if (backendValue && channelsObject[backendValue]) {
        channelsObject[backendValue].enabled = true;
      }
    });

    return channelsObject;
  };

  useEffect(() => {
    // Resolve params promise
    params.then((resolvedParams) => {
      setAgentId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
    fetchTags();
  }, [agentId]);

  useEffect(() => {
    if (agent) {
      setEditForm({
        name: agent.name,
        description: agent.description,
        personality: agent.personality,
        intent: agent.intent,
        additionalInformation: agent.additionalInformation,
        isActive: agent.isActive,
      });
    }
  }, [agent]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/agents/${agentId}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Transform database format to expected format
        const agent = data.data;
        const agentData = agent.data || {};

        // Convert channels object to array for the frontend
        const channelsArray = convertChannelsObjectToArray(agent.channels);

        const transformedAgent = {
          id: agent.id,
          userId: agent.user_id,
          name: agent.name,
          description: agent.description || "",
          agentType: getAgentTypeString(agent.type),
          personality: agentData.personality || "",
          intent: agentData.intent || "",
          additionalInformation: agentData.additionalInformation || "",
          systemPrompt: agent.system_prompt || "",
          isActive: agent.is_active !== false,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at || agent.created_at,
          channels: channelsArray,
          knowledgeBases: data.data.knowledge_bases
            ? data.data.knowledge_bases.map((kb) => kb.id)
            : [],
        };
        setAgent(transformedAgent);
        setSelectedMessageTypes(channelsArray);

        setTag(agentData?.tag);
      } else {
        throw new Error(data.error || "Failed to load agent");
      }
    } catch (error) {
      // console.error("Error loading agent:", error);
      toast.error("Failed to load agent");
      router.push("/dashboard/app/ai/agents");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const token = await getClientGhlToken();

      if (!token) return;

      const response = await fetch("/api/tags", {
        method: "GET",
        headers: {
          "x-location-id": "iXTmrCkWtZKXWzs85Jx8", // 👈 dynamic
          authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to fetch tags");
      }

      setGhlTags(json.data?.tags);
      return json.data?.tags || [];
    } catch (error) {
      toast.error("Failed to load tags");
      return [];
    }
  };

  const saveAgent = async () => {
    if (
      !editForm.name.trim() ||
      !editForm.personality.trim() ||
      !editForm.intent.trim()
    ) {
      toast.error("Name, personality, and intent are required");
      return;
    }

    try {
      setSaving(true);

      const channelsObject = convertArrayToChannelsObject(selectedMessageTypes);

      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          personality: editForm.personality,
          intent: editForm.intent,
          additionalInformation: editForm.additionalInformation,
          tag,
          is_active: editForm.isActive,
          channels: channelsObject,
          knowledgeBaseIds: selectedKBIds, // ✅ NEW
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const updatedAgent = data.data;
        toast.success("Agent updated successfully");

        setAgent({
          ...updatedAgent,
          additionalInformation: updatedAgent.data.additionalInformation,
          knowledgeBases: updatedAgent.knowledge_base_ids,
          personality: updatedAgent.data.personality,
          intent: updatedAgent.data.intent,
        });
        setEditing(false);
      } else {
        throw new Error(data.error || "Failed to update agent");
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const testAgent = async () => {
    if (!testInput.trim()) {
      toast.error("Please enter test input");
      return;
    }

    try {
      setTesting(true);
      const response = await fetch("/api/ai/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          query: testInput,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.answer) {
        setTestResult(data.data.answer);
        toast.success("Agent test completed");
      } else {
        setTestResult(
          `Demo response: I received your test message "${testInput}". This agent (${agent?.name}) would process this through the AI system when fully connected.`
        );
        toast.warning("AI backend unavailable - showing demo response");
      }
    } catch (error) {
      setTestResult(
        `Demo response: I received your test message "${testInput}". This agent (${agent?.name}) would process this through the AI system when fully connected.`
      );
      toast.warning("AI backend unavailable - showing demo response");
    } finally {
      setTesting(false);
    }
  };

  const deleteAgent = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Agent deleted successfully");
        router.push("/dashboard/app/ai/agents");
      } else {
        throw new Error(data.error || "Failed to delete agent");
      }
    } catch (error) {
      // console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  };

  const cancelEdit = () => {
    if (agent) {
      setEditForm({
        name: agent.name,
        description: agent.description,
        personality: agent.personality,
        intent: agent.intent,
        additionalInformation: agent.additionalInformation,
        isActive: agent.isActive,
      });
      setSelectedMessageTypes(agent.channels || []);
    }
    setEditing(false);
  };

  const getAgentTypeInfo = (type: string) => {
    return AGENT_TYPES[type as keyof typeof AGENT_TYPES] || AGENT_TYPES.query;
  };

  const handleKBSelectionChange = useCallback((ids: string[]) => {
    setSelectedKBIds(ids);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-8">
        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Agent not found</h3>
        <p className="text-muted-foreground mb-4">
          The requested agent could not be found.
        </p>
        <Button onClick={() => router.push("/dashboard/app/ai/agents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>
    );
  }

  const typeInfo = getAgentTypeInfo(agent.agentType);
  const SENDABLE_MESSAGE_TYPES = [
    {
      value: "SMS",
      backendValue: "sms",
      label: "SMS",
      description: "Text message",
    },
    {
      value: "Email",
      backendValue: "email",
      label: "Email",
      description: "Email message",
    },
    {
      value: "WhatsApp",
      backendValue: "whatsapp",
      label: "WhatsApp",
      description: "WhatsApp message",
    },
    {
      value: "FB",
      backendValue: "facebook",
      label: "Facebook Messenger",
      description: "Facebook message",
    },
    {
      value: "IG",
      backendValue: "instagram",
      label: "Instagram Direct",
      description: "Instagram message",
    },
    {
      value: "Live_Chat",
      backendValue: "web",
      label: "Web Chat",
      description: "Website chat message",
    },
    {
      value: "Custom",
      backendValue: "gmb",
      label: "Google Business Messages",
      description: "Google My Business message",
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/app/ai/agents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (agent) {
                    setEditForm({
                      name: agent.name || "",
                      description: agent.description || "",
                      personality: agent.personality || "",
                      intent: agent.intent || "",
                      additionalInformation: agent.additionalInformation || "",
                    });
                  }
                  setEditing(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{agent.name}"? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAgent}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={saveAgent} disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Agent Configuration
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Agent Name</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter agent name..."
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{agent.name}</div>
                  )}
                </div>

                {/* Description Field */}
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the agent's purpose..."
                    readOnly={!editing}
                    rows={8}
                    className={
                      !editing
                        ? "bg-muted border-0 focus-visible:ring-0 cursor-default"
                        : ""
                    }
                  />
                </div>

                <div className="grid gap-4">
                  {/* Personality Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="personality">AI Personality & Role</Label>
                    <Textarea
                      id="personality"
                      value={editForm.personality || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personality: e.target.value,
                        }))
                      }
                      placeholder="Define the AI's personality and role..."
                      rows={8}
                      readOnly={!editing} // 👈 disables typing when not editing
                      className={!editing ? "bg-muted cursor-default" : ""}
                    />
                  </div>

                  {/* Intent Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="intent">Primary Goal & Intent</Label>
                    <Textarea
                      id="intent"
                      value={editForm.intent || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          intent: e.target.value,
                        }))
                      }
                      placeholder="Define the primary goal and intent..."
                      rows={8}
                      readOnly={!editing}
                      className={
                        !editing
                          ? "bg-muted border-0 focus-visible:ring-0 cursor-default resize-none"
                          : ""
                      }
                    />
                  </div>

                  {/* Additional Information Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="additionalInformation">
                      Additional Guidelines
                    </Label>
                    <Textarea
                      id="additionalInformation"
                      value={editForm.additionalInformation || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          additionalInformation: e.target.value,
                        }))
                      }
                      placeholder="Additional guidelines and instructions..."
                      rows={8}
                      readOnly={!editing}
                      className={
                        !editing
                          ? "bg-muted border-0 focus-visible:ring-0 cursor-default resize-none"
                          : ""
                      }
                    />
                  </div>
                </div>

                {/* {editing && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editForm.isActive}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isActive">Agent is active</Label>
                  </div>
                )} */}
              </div>
            </CardContent>
          </Card>

          <Card className="px-7">
            <h1 className="font-bold">Available channels</h1>
            {SENDABLE_MESSAGE_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                {/* {editing && ( */}
                {/* <Checkbox
                  checked={selectedMessageTypes.includes(type.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMessageTypes((prev) => [...prev, type.value]);
                    } else {
                      setSelectedMessageTypes((prev) =>
                        prev.filter((v) => v !== type.value)
                      );
                    }
                  }}
                  disabled={!editing}
                /> */}
                <input
                  type="checkbox"
                  checked={selectedMessageTypes.includes(type.value)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      setSelectedMessageTypes((prev) => [...prev, type.value]);
                    } else {
                      setSelectedMessageTypes((prev) =>
                        prev.filter((v) => v !== type.value)
                      );
                    }
                  }}
                  className="w-4 h-4 accent-[#ef3d6d]"
                  disabled={!editing}
                />
                {/* )} */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{type.label}</span>
                </div>

                {/* <span className="text-sm font-medium">{type.label}</span> */}
              </label>
            ))}
          </Card>

          {/* Knowledge bases */}
          <Card className="px-7">
            <h1 className="font-bold">Knowledge Bases</h1>
            <KBTable
              selectable
              showActions={false}
              selectedKbs={agent?.knowledgeBases}
              onSelectionChange={handleKBSelectionChange}
              editMode // ✅ means table is being used on edit screen
              isEditing={editing}
            />
          </Card>

          {/* System Prompt Preview (Read-only) */}
          {!editing && (
            <div className="grid gap-2">
              <Card className="px-7">
                <h1 className="font-bold">Generated System Prompt</h1>
                <div className="p-3 bg-muted rounded-md">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {agent.systemPrompt || "No system prompt generated"}
                  </pre>
                </div>
              </Card>
            </div>
          )}

          {/* Test Agent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Agent
              </CardTitle>
              <CardDescription>
                Test your agent with sample input to see how it responds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="test-input">Test Input</Label>
                <Textarea
                  id="test-input"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter your test message or question..."
                  rows={3}
                />
              </div>

              <Button
                onClick={testAgent}
                disabled={testing || !testInput.trim()}
              >
                {testing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Agent
                  </>
                )}
              </Button>

              {testResult && (
                <div className="grid gap-2">
                  <Label>Agent Response</Label>
                  <div className="p-4 bg-card border border-border rounded-lg max-h-64 overflow-y-auto shadow-sm">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans bg-transparent border-0 p-0 m-0">
                        {testResult}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Agent Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{agent.userId}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Agent ID:</span>
                  <span className="font-mono text-xs">{agent.id}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <Badge className={typeInfo.color} variant="secondary">
                    {typeInfo.label}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setEditing(!editing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {editing ? "Cancel Edit" : "Edit Agent"}
              </Button> */}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setTestInput("Hello, can you help me?");
                }}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Quick Test
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  navigator.clipboard.writeText(agent.id);
                  toast.success("Agent ID copied to clipboard");
                }}
              >
                <Bot className="h-4 w-4 mr-2" />
                Copy Agent ID
              </Button>
            </CardContent>
          </Card>

          {/* Tags editing={editing}*/}
          <AddTagsModal
            ghlTags={ghlTags}
            editing={editing}
            setTag={setTag}
            tag={tag}
            setNewTag={setNewTag}
            handleAddTag={handleAddTag}
            newTag={newTag}
            handleDeleteTag={handleDeleteTag}
          />
        </div>
      </div>
    </div>
  );
}
