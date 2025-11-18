"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Bot,
  Database,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddTagsModal from "@/components/ai-agent/AddTagsModal";
import { getClientGhlToken } from "@/utils/ghl/tokenUtils";
import { KBTable } from "@/_components/knowledgebase/KBTable";

// Constants
const USER_ID = "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21";

interface CreateAgentForm {
  name: string;
  description: string;
  personality: string;
  intent: string;
  additionalInformation: string;
  variables: Record<string, string>;
  knowledgeBaseIds: string[];
  isActive: boolean;
  // AI Configuration (required by FastAPI)
  temperature: number;
  model: string;
  humanlikeBehavior: boolean;
}

const SENDABLE_MESSAGE_TYPES = [
  {
    value: "SMS",
    internal: "TYPE_SMS",
    label: "SMS",
    description: "Text message",
  },
  {
    value: "Email",
    internal: "TYPE_EMAIL",
    label: "Email",
    description: "Email message",
  },
  {
    value: "WhatsApp",
    internal: "TYPE_WHATSAPP",
    label: "WhatsApp",
    description: "WhatsApp message",
  },
  {
    value: "FB",
    internal: "TYPE_FACEBOOK",
    label: "Facebook Messenger",
    description: "Facebook message",
  },
  {
    value: "IG",
    internal: "TYPE_INSTAGRAM",
    label: "Instagram Direct",
    description: "Instagram message",
  },
  {
    value: "Live_Chat",
    internal: "TYPE_WEBCHAT",
    label: "Web Chat",
    description: "Website chat message",
  },
  {
    value: "Custom",
    internal: "TYPE_GMB",
    label: "Google Business Messages",
    description: "Google My Business message",
  },
] as const;

export default function CreateAgentPage() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [creating, setCreating] = useState(false);

  // Knowledge Base filtering state

  const [selectedMessageTypes, setSelectedMessageTypes] = useState<string[]>(
    []
  );
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<CreateAgentForm>({
    name: "",
    description: "",
    personality: "",
    intent: "",
    additionalInformation: "",
    variables: {},
    knowledgeBaseIds: [],
    isActive: false,
    // AI Configuration (required by FastAPI)
    temperature: 0.7,
    model: "gpt-4.1",
    humanlikeBehavior: false,
  });
  const [ghlTags, setGhlTags] = useState<
    { id: string; name: string; locationId: string }[]
  >([]);
  const [tag, setTag] = useState<string>(""); // instead of tags[]
  const [newTag, setNewTag] = useState("");

  // Detect agent type from URL params (1 = Conversation AI, 5 = Voice AI)
  const agentType = searchParams.get("type") === "5" ? 5 : 1;
  const isVoiceAgent = agentType === 5;
  const agentTypeName = isVoiceAgent
    ? "Voice AI Agent"
    : "Conversation AI Agent";
  const agentTypeDescription = isVoiceAgent
    ? "Create an AI assistant for voice conversations and phone calls"
    : "Create an intelligent AI assistant for text conversations";

  const progress = (currentStep / totalSteps) * 100;

  const convertArrayToChannelsObject = (selected: string[]) => {
    const channelMappings = {
      SMS: "sms",
      Email: "email",
      WhatsApp: "whatsapp",
      FB: "facebook",
      IG: "instagram",
      Live_Chat: "web",
      Custom: "gmb",
    };

    return Object.fromEntries(
      Object.entries(channelMappings).map(([frontend, backend]) => [
        backend,
        { enabled: selected.includes(frontend), settings: {} },
      ])
    );
  };

  const createAgent = async () => {
    // Prevent multiple submissions
    if (creating) {
      return;
    }

    try {
      setCreating(true);

      // Final validation before submission
      if (
        !formData.name.trim() ||
        !formData.personality.trim() ||
        !formData.intent.trim()
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Convert type number to agentType string as expected by FastAPI
      const getAgentTypeString = (type: number): string => {
        switch (type) {
          case 1:
            return "generic"; // AI Agent (GENERIC)
          default:
            return "generic";
        }
      };

      const payload = {
        userId: USER_ID,
        name: formData.name,
        description: formData.description || "",
        agentType: getAgentTypeString(agentType), // Use detected type from URL params
        type: agentType, // Pass the numeric type (1 or 5)
        personality: formData.personality,
        intent: formData.intent,
        additionalInformation: formData.additionalInformation || " ",
        variables:
          Object.keys(formData.variables).length > 0
            ? formData.variables
            : null,
        knowledgeBaseIds: selectedKBIds,
        // AI Configuration (required by FastAPI)
        temperature: formData.temperature,
        model: formData.model,
        humanlikeBehavior: formData.humanlikeBehavior,
        channels: convertArrayToChannelsObject(selectedMessageTypes),
        tag,
        isActive: formData.isActive,
      };
      console.log("payload: ", payload);

      const response = await fetch("/api/ai/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json(); // <-- read backend error
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success("🎉 AI Agent created successfully! Redirecting...");

        // Use window.location to ensure proper redirect and prevent route conflicts
        setTimeout(() => {
          window.location.href = "/dashboard/app/ai/agents";
        }, 1500);
      } else {
        toast.error(
          "Failed to create agent: " + (data.error || "Unknown error")
        );
      }
    } catch (error: any) {
      console.log("Error creating agent:", error);
      toast.error(error.message); // backend message
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Basic info validation
        return formData.name.trim().length >= 2;
      case 2:
        // Configuration validation
        return (
          formData.name.trim().length >= 2 &&
          formData.personality.trim().length >= 10 &&
          formData.intent.trim().length >= 10
        );
      case 3:
        return true; // Knowledge base selection is optional
      default:
        return false;
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      setTag(newTag.trim());
      setNewTag("");
    }
  };

  const handleDeleteTag = () => {
    setTag("");
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
      // console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
      return [];
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleKBSelectionChange = useCallback((ids: string[]) => {
    setSelectedKBIds(ids);
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                🎯 Basic Information
              </h2>
              <p className="text-muted-foreground">
                Set up the basic details for your AI agent.
              </p>
            </div>

            <div className="space-y-4">
              {/* Agent Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Assistant"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/50 characters
                </p>
              </div>

              {/* Agent Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this agent does..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/100000 characters
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                ⚙️ Configure Your Agent
              </h2>
              <p className="text-muted-foreground">
                Define your agent's personality, goals, and behavior.
              </p>
            </div>

            <div className="space-y-6">
              {/* Main Configuration */}
              <div className="space-y-4">
                {/* Personality */}
                <div className="space-y-2">
                  <Label htmlFor="personality">Personality & Role *</Label>
                  <Textarea
                    id="personality"
                    placeholder="Example: You are a friendly customer support agent for {{business_name}}. You help customers with their questions and maintain a professional yet warm tone."
                    value={formData.personality}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        personality: e.target.value,
                      }))
                    }
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.personality.length}/100000 characters • Use {"{{"}{" "}
                    variable {"}"} for dynamic content
                  </p>
                </div>

                {/* Primary Goal */}
                <div className="space-y-2">
                  <Label htmlFor="intent">Primary Goal *</Label>
                  <Textarea
                    id="intent"
                    placeholder="Example: Your goal is to assist customers by answering their questions, resolving issues, and providing helpful information about our products and services."
                    value={formData.intent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        intent: e.target.value,
                      }))
                    }
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.intent.length}/100000 characters
                  </p>
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Guidelines</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Example: Keep responses between 20-50 words. Always ask follow-up questions. If you don't know something, direct customers to our support team."
                    value={formData.additionalInformation}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        additionalInformation: e.target.value,
                      }))
                    }
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional rules, tone guidelines, or specific instructions
                  </p>
                </div>

                {/* Variables */}
                {/* <div className="space-y-2">
                  <Label>Variables (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Variable name: value (e.g., business_name: Acme Corp)"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const input = e.target as HTMLInputElement;
                          const [name, value] = input.value
                            .split(":")
                            .map((s) => s.trim());
                          if (name && value) {
                            setFormData((prev) => ({
                              ...prev,
                              variables: { ...prev.variables, [name]: value },
                            }));
                            input.value = "";
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Press Enter to add. Format: variable_name: value
                    </p>

                    {Object.entries(formData.variables).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(formData.variables).map(
                          ([key, value]) => (
                            <Badge
                              key={key}
                              variant="outline"
                              className="text-xs"
                            >
                              {`{{${key}}}`}: {value}
                              <button
                                onClick={() => {
                                  const newVars = { ...formData.variables };
                                  delete newVars[key];
                                  setFormData((prev) => ({
                                    ...prev,
                                    variables: newVars,
                                  }));
                                }}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div> */}
              </div>

              <Card className="p-4 space-y-3">
                {SENDABLE_MESSAGE_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMessageTypes.includes(type.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMessageTypes((prev) => [
                            ...prev,
                            type.value,
                          ]);
                        } else {
                          setSelectedMessageTypes((prev) =>
                            prev.filter((v) => v !== type.value)
                          );
                        }
                      }}
                    />
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                ))}
              </Card>

              <AddTagsModal
                ghlTags={ghlTags}
                editing={true}
                setTag={setTag}
                tag={tag}
                setNewTag={setNewTag}
                handleAddTag={handleAddTag}
                newTag={newTag}
                handleDeleteTag={handleDeleteTag}
              />

              {/* AI Configuration */}
              <Card className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    AI Configuration
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Configure how your AI agent responds and behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model</Label>
                      {/* <Select
                        value={formData.model}
                        onValueChange={(value) =>
                          setFormData({ ...formData, model: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llama-3.1-8b-instant">
                            llama-3.1-8b-instant
                          </SelectItem>
                          <SelectItem value="llama-3.3-70b-versatile">
                            llama-3.3-70b-versatile
                          </SelectItem>
                          <SelectItem value="meta-llama/llama-guard-4-12b">
                            meta-llama/llama-guard-4-12b
                          </SelectItem>
                        </SelectContent>
                      </Select> */}
                      <Select
                        value={formData.model}
                        onValueChange={(value) =>
                          setFormData({ ...formData, model: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
                          <SelectItem value="gpt-4.1-mini">
                            gpt-4.1-mini
                          </SelectItem>
                          <SelectItem value="gpt-4.1-nano">
                            gpt-4.1-nano
                          </SelectItem>
                          <SelectItem value="gpt-3.5-turbo">
                            gpt-3.5-turbo
                          </SelectItem>
                          <SelectItem value="o3-mini">o3-mini</SelectItem>
                          {/* Add others as needed */}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    {/* <div className="space-y-2">
                      <Label htmlFor="temperature">Creativity Level</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[formData.temperature]}
                          onValueChange={(value) =>
                            setFormData({ ...formData, temperature: value[0] })
                          }
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Consistent</span>
                          <span className="font-medium text-blue-600">
                            {formData.temperature}
                          </span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div> */}

                    {/* Human-like Behavior */}
                    {/* <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="humanlikeBehavior">Response Style</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="humanlikeBehavior"
                          checked={formData.humanlikeBehavior}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              humanlikeBehavior: checked,
                            })
                          }
                        />
                        <Label htmlFor="humanlikeBehavior" className="text-sm">
                          {formData.humanlikeBehavior
                            ? "Natural & Human-like"
                            : "Direct & Professional"}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.humanlikeBehavior
                          ? "Responses will include natural variations and human-like expressions"
                          : "Responses will be direct and to-the-point"}
                      </p>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold flex items-center justify-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Knowledge Sources
              </h2>
              <p className="text-xs text-muted-foreground">
                Connect your agent to knowledge bases for enhanced, contextual
                responses. This step is optional.
              </p>
            </div>

            {/* Self-fetching table with checkboxes, no actions */}
            <KBTable
              selectable
              showActions={false}
              selectedKbs={selectedKBIds}
              onSelectionChange={handleKBSelectionChange}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2:
        return (
          formData.name.trim().length >= 2 &&
          formData.personality.trim().length >= 10 &&
          formData.intent.trim().length >= 10 &&
          tag.trim().length > 3
        );
      case 3:
        return true; // Knowledge base selection is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* Main Wizard Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <a
                  href="/dashboard/app/ai/agents"
                  className="hover:text-foreground transition-colors"
                >
                  AI Agents
                </a>
                <span>/</span>
                <span className="text-foreground font-medium">
                  Create New Agent
                </span>
              </div>

              {/* Clean Page Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {agentTypeName} Wizard
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    {agentTypeDescription}
                  </p>
                </div>
              </div>

              {/* Clean Progress Section */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <Badge variant="outline">{agentTypeName}</Badge>
                </div>

                <div className="space-y-3">
                  <Progress value={progress} className="h-2" />

                  {/* Simple Step Navigation */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { step: 1, title: "Basic Info", icon: Bot },
                      { step: 2, title: "Configure", icon: Settings },
                      { step: 3, title: "Knowledge", icon: Database },
                    ].map((stepInfo) => (
                      <div
                        key={stepInfo.step}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          currentStep === stepInfo.step
                            ? "bg-primary text-primary-foreground border-primary"
                            : currentStep > stepInfo.step
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <stepInfo.icon
                          className={`h-4 w-4 mx-auto mb-1 ${
                            currentStep === stepInfo.step
                              ? "text-primary-foreground"
                              : currentStep > stepInfo.step
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        />
                        <div className="text-sm font-medium">
                          {stepInfo.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <Card className="mb-8 border">
              <CardContent className="p-8">{renderStepContent()}</CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                {currentStep === totalSteps ? (
                  <Button
                    type="button"
                    onClick={createAgent}
                    disabled={creating || !isStepValid()}
                  >
                    {creating ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        Creating Agent...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Create AI Agent
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
