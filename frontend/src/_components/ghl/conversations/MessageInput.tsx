"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
// import { getSupabase } from "@/utils/supabase/getSupabase";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  MessageSquare,
  Zap,
  BarChart3,
  Play,
  Pause,
  Info,
  RotateCcw,
  Thermometer,
  CheckCircle2,
  Search,
  Bot,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { ConversationSettings } from "./types";
import {
  getFeatureAIConfig,
  AI_MODELS,
  TEMPERATURE_PRESETS,
  AIConfig,
} from "@/utils/ai/config/aiSettings";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageType } from "@/_components/actions/ghl/types";
import { debug } from "console";
import { Card } from "@/components/ui/card";
import useWebSocket from "./hooks/useWebSocket";
// import {  } from '@/lib/leadconnector/types/messageTypes';

import { useGhlWebSocket } from "./hooks/useGhlWebSocket";
import ChatPage from "./ChatPage";
import { useSocket } from "../../../../context/SocketProvider";
import { getClientGhlToken } from "@/utils/ghl/tokenUtils";
import { set } from "date-fns";

// import { getGhlTokenForUser } from "@/utils/ghl/tokenUtils";

interface Suggestion {
  text: string;
  confidence: number;
}

interface ChatMessage {
  id: string;
  body: string;
  dateAdded: string;
  direction: "inbound" | "outbound";
  messageType?: string;
  locationId?: string;
  contactId?: string;
  conversationId?: string;
  status?: string;
  type?: string | number;
  source?: string;
  // Additional properties that might be present in Message type
  contactName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  contactId?: string;
  fullName?: string;
  contactName?: string;
}

interface MessageInputProps {
  conversationId: string;
  recentMessages?: ChatMessage[];
  onToggleQuery?: (show: boolean) => void;
  locationId: string;
  disabled?: boolean;
  showQueryInput?: boolean;
  isConversationTrained?: boolean;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  conversationType?: string; // e.g., 'TYPE_SMS', 'TYPE_EMAIL', etc.
  messagesList: MessageList;
  isTrainingInProgresss: boolean;
  // newMessage: string;
  //   selectedMessageType:string;
  //   setSelectedMessageType:any;
  //  getAvailableMessageTypes: (messagesList: any[]) => MessageTypeOption[];
}

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

interface SuggestionsResponse {
  suggestions: string[];
  total: number;
  conversationId: string;
  timestamp: string;
  data?: {
    suggestions?: string[];
  };
}

interface ChatResponse
  extends ApiResponse<{
    response_suggestion?: string;
    autopilot_response?: string;
    confidence_score?: number;
    conversationId?: string;
    timestamp?: string;
  }> {}

// AI Settings Configuration - Enhanced with centralized config
interface AISettings {
  recentMessagesCount: number;
  suggestionsLimit: number;
  contextDepth: number;
  includeEmailMessages: boolean;
  prioritizeCustomerMessages: boolean;
  confidenceThreshold: number;
  // New AI configuration options
  aiConfig: AIConfig;
}

const DEFAULT_AI_SETTINGS: AISettings = {
  recentMessagesCount: 5,
  suggestionsLimit: 3, // Default number of suggestions (1-6)
  contextDepth: 5,
  includeEmailMessages: true, // Enable email messages by default for autopilot
  prioritizeCustomerMessages: true,
  confidenceThreshold: 0.7,
  aiConfig: getFeatureAIConfig("suggestions"),
};

// Minimum required messages with body content for AI to work effectively
const MIN_REQUIRED_MESSAGES = 5;
const MIN_REQUIRED_MESSAGES_AUTOPILOT = 10;
const MIN_REQUIRED_MESSAGES_AUTOPILOT_LENIENT = 3; // For conversations with mostly system messages

const USER_ID = "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21";

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
    label: "Facebook",
    description: "Facebook message",
  },
  {
    value: "IG",
    internal: "TYPE_INSTAGRAM",
    label: "Instagram",
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
    label: "Google Business",
    description: "Google My Business message",
  },
] as const;

// Helper function to map internal message type to GHL API type
const mapInternalToGHLType = (internalType: string): string => {
  const mapping = SENDABLE_MESSAGE_TYPES.find(
    (t) => t.internal === internalType
  );
  return mapping?.value || "SMS"; // Default to SMS
};

// Auto-detect message type from conversation messages
const detectConversationMessageType = (messages: ChatMessage[]): string => {
  // Count message types to determine most common
  const typeCounts: Record<string, number> = {};

  for (const msg of messages) {
    if (msg.messageType) {
      const ghlType = mapInternalToGHLType(msg.messageType);
      typeCounts[ghlType] = (typeCounts[ghlType] || 0) + 1;
    }
  }

  // Return most common type
  let mostCommonType = "SMS";
  let maxCount = 0;

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      mostCommonType = type;
      maxCount = count;
    }
  }
  return mostCommonType;
};

interface MessageTypeOption {
  value: string;
  internal: string;
  label: string;
  description: string;
}

const getAvailableMessageTypes = (messagesList: any[]): MessageTypeOption[] => {
  if (!messagesList || messagesList.length === 0) {
    return [
      {
        value: "SMS",
        internal: "TYPE_SMS",
        label: "SMS",
        description: "Text message",
      },
    ];
  }

  const existingTypes = new Set(messagesList.map((msg) => msg.messageType));

  // Filter to only include types that exist in messages AND are in SENDABLE_MESSAGE_TYPES
  const result = SENDABLE_MESSAGE_TYPES.filter((type) => {
    return existingTypes.has(type.internal);
  });

  return result as MessageTypeOption[];
};

// Function to auto-detect default message type
const getDefaultMessageType = (
  conversationType?: string,
  recentMessages?: ChatMessage[]
): string => {
  // If conversation type is provided, use it
  if (
    conversationType &&
    SENDABLE_MESSAGE_TYPES.some((type) => type.value === conversationType)
  ) {
    return conversationType;
  }

  // Try to detect from recent messages (use most recent outbound message type)
  if (recentMessages && recentMessages.length > 0) {
    const recentOutbound = recentMessages
      .filter((msg) => msg.direction === "outbound" && msg.messageType)
      .slice(0, 5); // Check last 5 outbound messages

    for (const msg of recentOutbound) {
      if (
        msg.messageType &&
        SENDABLE_MESSAGE_TYPES.some((type) => type.value === msg.messageType)
      ) {
        return msg.messageType;
      }
    }

    // Fallback to any recent message type
    const recentTypes = recentMessages
      .map((msg) => msg.messageType)
      .filter(
        (type): type is string =>
          type !== undefined &&
          SENDABLE_MESSAGE_TYPES.some((t) => t.value === type)
      );

    if (recentTypes.length > 0) {
      return recentTypes[0];
    }
  }

  // Default to SMS
  return "TYPE_SMS";
};

// Helper function to clean up suggestion text
const cleanSuggestionText = (text: string): string => {
  if (!text) return "";

  let cleaned = text.trim();

  // Remove patterns like "**Follow-Up Suggestion 1:** " at the beginning
  cleaned = cleaned.replace(/^\*\*[^*]*\*\*:\s*/, "");

  // Remove surrounding quotes if present
  cleaned = cleaned.replace(/^["']/, "").replace(/["']$/, "");

  // Trim again
  cleaned = cleaned.trim();

  // console.log("🧹 Text cleaning:", {
  //   original: text.substring(0, 100),
  //   cleaned: cleaned.substring(0, 100),
  //   originalLength: text.length,
  //   cleanedLength: cleaned.length,
  //   success: cleaned.length > 0,
  // });

  // Return cleaned text, or original if cleaning failed
  return cleaned.length > 0 ? cleaned : text;
};
export interface Message {
  id: string;
  type: number;
  contactId: string;
  contentType?: string;
  locationId: string;
  conversationId: string;
  dateAdded: string;
  dateUpdated: string;
  userId?: string;
  messageType: MessageType;
  source?: "app" | "workflow" | "campaign";
  [key: string]: any;
}
export type MessageList = Message[];

export function MessageInput({
  conversationId,
  recentMessages = [],
  onToggleQuery,
  locationId,
  disabled,
  showQueryInput,
  isConversationTrained = false,
  contactInfo: urlContactInfo,
  conversationType,
  messagesList,
}: // newMessage,
// selectedMessageType,
// setSelectedMessageType,
// getAvailableMessageTypes
MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loadingType, setLoadingType] = useState<
    "send" | "auto" | "suggest" | "apply" | null
  >(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [autoPilotResponse, setAutoPilotResponse] = useState<string | null>(
    null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  const [conversationSettings, setConversationSettings] =
    useState<ConversationSettings | null>(null);

  const { sendMessage } = useSocket();

  const [selectedMessageType, setSelectedMessageType] = useState<string>("");

  // useEffect(() => {
  //   const availableTypes = getAvailableMessageTypes(messagesList);
  //   if (availableTypes.length > 0 && !selectedMessageType) {
  //     setSelectedMessageType(availableTypes[0].internal);
  //   }
  // }, [messagesList, selectedMessageType]);
  useEffect(() => {
    // const availableTypes = getAvailableMessageTypes(messagesList);
    if (messagesList && messagesList.length > 0) {
      // Find the most recent inbound message
      const latestInbound = [...messagesList]
        .reverse()
        .find((msg) => msg.direction === "inbound");
      // console.log("latestInbound.messageType",latestInbound)

      // Auto-set dropdown based on the latest inbound message type
      if (
        latestInbound?.messageType &&
        latestInbound.messageType !== selectedMessageType
      ) {
        // console.log("latestInbound.messageType",latestInbound.messageType)
        setSelectedMessageType(latestInbound.messageType);
      }
    }
  }, [messagesList, selectedMessageType]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trainingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea with proper height management
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      // Reset height to auto to get the actual scroll height
      textarea.style.height = "auto";
      // Set height to scroll height with max limit of 150px (about 6 lines)
      const maxHeight = 150;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;

      // Enable/disable scrolling based on content
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    };

    // Adjust height on content change
    adjustHeight();

    // Add input event listener for real-time adjustment
    textarea.addEventListener("input", adjustHeight);

    return () => {
      textarea.removeEventListener("input", adjustHeight);
    };
  }, [message]); // Re-run when message changes

  // Track changes to auto-pilot response
  useEffect(() => {
    setHasUnsavedChanges(
      autoPilotResponse ? message !== autoPilotResponse : false
    );
  }, [message, autoPilotResponse]);

  // Handle message changes
  const handleMessageChange = useCallback(
    (newMessage: string, fromSuggestion: boolean = false) => {
      setMessage(newMessage);
      // Only clear suggestions if user is typing (not from applying a suggestion)
      if (!autoPilotResponse && !fromSuggestion) {
        setSuggestions([]);
      }
    },
    [autoPilotResponse]
  );

  // Helper function to get valid messages with body content
  const getValidMessages = useCallback(
    (messages: ChatMessage[]): ChatMessage[] => {
      // Reduced logging for better performance
      if (messages.length > 0) {
        // console.log("🔍 Message validation:", {
        //   total: messages.length,
        //   withBody: messages.filter((msg) => msg.body && msg.body.trim())
        //     .length,
        //   includeEmails: aiSettings.includeEmailMessages,
        // });
      }

      // For autopilot, we need to be more lenient - include messages that represent conversation events
      // even if they don't have traditional "body" content
      let validMessages = messages.filter((msg) => {
        // Make sure body is a string before trimming
        if (typeof msg.body === "string" && msg.body.trim()) {
          return true;
        }

        // For autopilot purposes, include certain message types
        const meaningfulTypes = [
          "TYPE_ACTIVITY_OPPORTUNITY",
          "TYPE_ACTIVITY_CONTACT",
          "TYPE_ACTIVITY_APPOINTMENT",
          "TYPE_ACTIVITY_PAYMENT",
          "TYPE_ACTIVITY_INVOICE",
        ];

        if (meaningfulTypes.includes(msg.messageType || "")) {
          return true;
        }

        return false;
      });

      // Apply email filter if disabled in settings
      if (!aiSettings.includeEmailMessages) {
        validMessages = validMessages.filter(
          (msg) => msg.messageType !== "TYPE_EMAIL"
        );
      }

      // Only log final result
      if (validMessages.length !== messages.length) {
        // console.log(
        //   "✅ Valid messages:",
        //   validMessages.length,
        //   "of",
        //   messages.length
        // );
      }

      return validMessages;
    },
    [aiSettings.includeEmailMessages]
  );

  // Helper function to get messages ensuring minimum count with body content from both customer and system user
  const getMessagesWithMinimum = useCallback(
    (
      messages: ChatMessage[],
      configuredCount: number,
      isAutoPilot: boolean = false
    ): ChatMessage[] => {
      const validMessages = getValidMessages(messages);
      let minRequired = isAutoPilot
        ? MIN_REQUIRED_MESSAGES_AUTOPILOT
        : MIN_REQUIRED_MESSAGES;

      // For autopilot, use lenient requirements if the conversation has mostly system messages
      if (isAutoPilot && messages.length > 0) {
        const systemMessages = messages.filter(
          (msg) =>
            msg.messageType?.includes("EMAIL") ||
            msg.source === "workflow" ||
            msg.source === "campaign"
        ).length;

        const systemRatio = systemMessages / messages.length;

        if (systemRatio > 0.7) {
          minRequired = MIN_REQUIRED_MESSAGES_AUTOPILOT_LENIENT;
        }
      }

      // If we don't have any valid messages, return empty array
      if (validMessages.length === 0) {
        // console.log("🔄 No valid messages found:", {
        //   totalMessages: messages.length,
        //   validMessages: 0,
        // });
        return [];
      }

      // If we have fewer valid messages than the minimum required, use ALL valid messages
      if (validMessages.length < minRequired) {
        // console.log(
        //   "🔄 Using all available messages (insufficient for minimum):",
        //   {
        //     totalMessages: messages.length,
        //     totalValidMessages: validMessages.length,
        //     configuredCount,
        //     minRequired,
        //     isAutoPilot,
        //     usingAll: true,
        //     messageTypes: validMessages.map((m) => ({
        //       id: m.id,
        //       type: m.messageType,
        //       hasBody: !!m.body?.trim(),
        //     })),
        //   }
        // );
        return validMessages; // Use ALL available valid messages
      }

      // If we have enough valid messages, ensure we get at least the minimum
      // Always prioritize getting the most recent messages with content
      const targetCount = Math.max(configuredCount, minRequired);
      const selectedMessages = validMessages.slice(-targetCount);

      // console.log("🔄 Auto-extending messages (sufficient available):", {
      //   totalMessages: messages.length,
      //   totalValidMessages: validMessages.length,
      //   configuredCount,
      //   targetCount,
      //   selectedCount: selectedMessages.length,
      //   extendedBeyondConfig: selectedMessages.length > configuredCount,
      //   reachedMinimum: selectedMessages.length >= minRequired,
      //   isAutoPilot,
      //   minRequired,
      //   sampleSelectedMessages: selectedMessages.slice(0, 3).map((m) => ({
      //     id: m.id,
      //     direction: m.direction,
      //     type: m.messageType,
      //     bodyPreview: m.body?.substring(0, 50) + "...",
      //   })),
      // });

      return selectedMessages;
    },
    [getValidMessages]
  );

  // Helper function to get actual message counts for display
  const getMessageCounts = useCallback(
    (isAutoPilot: boolean = false) => {
      const validMessages = getValidMessages(recentMessages);
      const recentWithMinimum = getMessagesWithMinimum(
        recentMessages,
        aiSettings.recentMessagesCount,
        isAutoPilot
      );
      const contextWithMinimum = getMessagesWithMinimum(
        recentMessages,
        aiSettings.contextDepth,
        isAutoPilot
      );

      // For autopilot, use lenient requirements if the conversation has mostly system messages
      let minRequired = isAutoPilot
        ? MIN_REQUIRED_MESSAGES_AUTOPILOT
        : MIN_REQUIRED_MESSAGES;

      if (isAutoPilot && recentMessages.length > 0) {
        // Calculate ratio of system messages (emails, workflows, etc.)
        const systemMessages = recentMessages.filter(
          (msg) =>
            msg.messageType?.includes("EMAIL") ||
            msg.source === "workflow" ||
            msg.source === "campaign"
        ).length;

        const systemRatio = systemMessages / recentMessages.length;

        // If >70% of messages are system-generated, use lenient requirements
        if (systemRatio > 0.7) {
          minRequired = MIN_REQUIRED_MESSAGES_AUTOPILOT_LENIENT;
          // console.log("🤖 Using lenient autopilot requirements:", {
          //   totalMessages: recentMessages.length,
          //   systemMessages,
          //   systemRatio: Math.round(systemRatio * 100) + "%",
          //   minRequired,
          //   validMessages: validMessages.length,
          // });
        }
      }

      // Determine if we're using all available messages due to insufficient count
      const usingAllAvailable = validMessages.length < minRequired;

      return {
        total: recentMessages.length,
        valid: validMessages.length,
        recentConfigured: aiSettings.recentMessagesCount,
        recentActual: recentWithMinimum.length,
        contextConfigured: aiSettings.contextDepth,
        contextActual: contextWithMinimum.length,
        hasValidMessages: validMessages.length > 0,
        hasMinimumMessages: validMessages.length >= minRequired,
        missingMessages: Math.max(0, minRequired - validMessages.length),
        extendedForMinimum:
          recentWithMinimum.length > aiSettings.recentMessagesCount ||
          contextWithMinimum.length > aiSettings.contextDepth,
        canReachMinimum: validMessages.length >= minRequired,
        usingAllAvailable,
        minRequired,
        isAutoPilot,
      };
    },
    [
      recentMessages,
      aiSettings.recentMessagesCount,
      aiSettings.contextDepth,
      getValidMessages,
      getMessagesWithMinimum,
    ]
  );

  // Extract customer information from messages and URL
  const getCustomerInfo = (messages: ChatMessage[]): CustomerInfo => {
    // Start with URL contact info (highest priority)
    const baseInfo: CustomerInfo = {
      name: urlContactInfo?.name,
      email: urlContactInfo?.email,
      phone: urlContactInfo?.phone,
    };

    // If we have complete info from URL, use it
    if (baseInfo.name && (baseInfo.email || baseInfo.phone)) {
      return {
        ...baseInfo,
        contactId: messages.length > 0 ? messages[0].contactId : undefined,
        fullName: baseInfo.name,
        contactName: baseInfo.name,
      };
    }

    // Otherwise, extract from messages and merge with URL info
    if (!messages.length) return baseInfo;

    // Try to get info from the most recent inbound message first
    const inboundMessage = [...messages]
      .reverse()
      .find((msg) => msg.direction === "inbound");
    const referenceMessage = inboundMessage || messages[0];

    return {
      name:
        baseInfo.name ||
        referenceMessage.contactName ||
        referenceMessage.fullName,
      email: baseInfo.email || referenceMessage.email,
      phone: baseInfo.phone || referenceMessage.phone,
      contactId: referenceMessage.contactId,
      fullName: baseInfo.name || referenceMessage.fullName,
      contactName: baseInfo.name || referenceMessage.contactName,
    };
  };

  // Generic API call handler - Enhanced with AI config
  const callApi = async <T,>(
    endpoint: string,
    payload: any,
    feature?: "query" | "suggestions" | "autopilot" | "summary"
  ): Promise<T> => {
    // console.log(`🌐 Making API call to: /api${endpoint}`);
    // console.log(
    //   `🔍 FASTAPI_URL environment: ${
    //     process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"
    //   }`
    // );

    // Get feature-specific AI configuration
    const aiConfig = feature
      ? getFeatureAIConfig(feature, aiSettings.aiConfig)
      : aiSettings.aiConfig;

    // Add AI configuration to payload
    const enhancedPayload = {
      ...payload,
      temperature: aiConfig.temperature,
      model: aiConfig.model,
      humanlikeBehavior: aiConfig.humanlikeBehavior,
    };

    // console.log(
    //   "📤 Request payload with AI config:",
    //   JSON.stringify(enhancedPayload, null, 2)
    // );
    // console.log("🤖 AI Configuration:", {
    //   model: aiConfig.model,
    //   temperature: aiConfig.temperature,
    //   humanlikeBehavior: aiConfig.humanlikeBehavior,
    //   feature,
    // });

    // Additional debugging for endpoint detection
    // console.log("🔍 API Call Debug Info:", {
    //   endpoint,
    //   fullUrl: endpoint,
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   payloadSize: JSON.stringify(enhancedPayload).length,
    //   timestamp: new Date().toISOString(),
    // });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enhancedPayload),
    });

    // console.log(
    //   `📥 Response status: ${response.status} ${response.statusText}`
    // );
    // console.log(
    //   "🔍 Response headers:",
    //   Object.fromEntries(response.headers.entries())
    // );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API error response:", errorText);
      console.error("🔍 Full response details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // console.log("📋 Response data:", JSON.stringify(data, null, 2));
    // console.log("🔍 Response analysis:", {
    //   success: data.success,
    //   hasData: !!data.data,
    //   dataKeys: data.data ? Object.keys(data.data) : [],
    //   hasError: !!data.error,
    //   responseSize: JSON.stringify(data).length,
    // });

    if (!data.success) {
      console.error("❌ API request failed with error:", data.error);
      console.error("🔍 Failed request context:", {
        endpoint,
        feature,
        payloadKeys: Object.keys(enhancedPayload),
        aiConfig: {
          model: aiConfig.model,
          temperature: aiConfig.temperature,
        },
      });
      throw new Error(data.error || "API request failed");
    }

    return data;
  };

  const handleGetSuggestions = async () => {
    if (loadingType) return;

    try {
      setLoadingType("suggest");

      // Get query from current message input if available
      const queryMessage =
        message.trim() || "Generate suggestions for this conversation";

      // Get the agent ID for suggestions feature (new structure or backward compatibility)
      const suggestionsAgentId =
        conversationSettings?.agents?.suggestions ||
        (conversationSettings?.agentType === "suggestions"
          ? conversationSettings?.selectedAgentId
          : null);

      // console.log("🎯 Generating suggestions:", {
      //   queryText: queryMessage,
      //   recentMessagesCount: recentMessages.length,
      //   validMessagesCount: getValidMessages(recentMessages).length,
      //   suggestionsAgentId: suggestionsAgentId,
      //   conversationSettings: conversationSettings,
      //   aiSettings: {
      //     ...aiSettings,
      //     aiConfig: {
      //       model: aiSettings.aiConfig.model,
      //       temperature: aiSettings.aiConfig.temperature,
      //       humanlikeBehavior: aiSettings.aiConfig.humanlikeBehavior,
      //     },
      //   },
      // });

      // Build the base request payload
      const requestPayload = {
        userId: USER_ID,
        conversationId,
        query: queryMessage,
        context: getValidMessages(recentMessages)
          .slice(-aiSettings.contextDepth)
          .map(
            (msg) =>
              `${msg.direction === "inbound" ? "Customer" : "Agent"}: ${
                msg.body
              }`
          )
          .join("\n"),
        knowledgebaseId: conversationId,
        limit: aiSettings.suggestionsLimit,
        // Always include agent ID - use selected agent or fallback to null for default behavior
        agentId: suggestionsAgentId || null,
        customerInfo: {
          name: getCustomerInfo(recentMessages).name,
          email: getCustomerInfo(recentMessages).email,
          phone: getCustomerInfo(recentMessages).phone,
          contactId: getCustomerInfo(recentMessages).contactId,
        },
        recentMessages: getValidMessages(recentMessages)
          .slice(-aiSettings.recentMessagesCount)
          .map((msg) => ({
            id: msg.id,
            body: msg.body,
            dateAdded: msg.dateAdded,
            direction: msg.direction,
            messageType: msg.messageType || "TYPE_SMS",
            role: msg.direction
              ? msg.direction === "inbound"
                ? "customer"
                : "system user"
              : "system notification",
          })),
      };

      // Use agent-aware endpoint if we have a selected agent
      let endpoint = "/api/ai/conversation/suggestions";
      let agentRequestPayload = requestPayload;

      if (
        suggestionsAgentId &&
        conversationSettings?.features?.suggestions?.enabled !== false
      ) {
        // Use agent-aware endpoint with selected agent
        endpoint = "/api/ai/agents/conversation";
        agentRequestPayload = {
          ...requestPayload,
          agentId: suggestionsAgentId,
          mode: "suggestions",
          limit:
            conversationSettings?.features?.suggestions?.limit ||
            aiSettings.suggestionsLimit,
        } as any;

        // console.log("🤖 Using selected agent for suggestions:", {
        //   selectedAgentId: suggestionsAgentId,
        //   endpoint: endpoint,
        //   featuresEnabled: conversationSettings?.features?.suggestions?.enabled,
        //   limit:
        //     conversationSettings?.features?.suggestions?.limit ||
        //     aiSettings.suggestionsLimit,
        // });
      } else {
        // console.log(
        //   "🤖 No suggestions agent selected, using direct FastAPI endpoint with default agent"
        // );
      }

      // LOG: Detailed request payload before sending
      // console.log("📤 SUGGESTIONS REQUEST:", {
      //   endpoint,
      //   agentId: agentRequestPayload.agentId || null,
      //   mode: (agentRequestPayload as any).mode || "direct",
      //   conversationId: agentRequestPayload.conversationId,
      //   queryLength: agentRequestPayload.query?.length || 0,
      //   contextLength: agentRequestPayload.context?.length || 0,
      //   messagesCount: agentRequestPayload.recentMessages?.length || 0,
      //   limit: agentRequestPayload.limit,
      // });

      const data = await callApi<SuggestionsResponse>(
        endpoint,
        agentRequestPayload,
        "suggestions"
      );

      // console.log(
      //   "🔍 Full Suggestions API response:",
      //   JSON.stringify(data, null, 2)
      // );

      // Handle response - try multiple possible response formats
      let suggestions = [];

      // Try different response structures
      if (data.data?.suggestions && Array.isArray(data.data.suggestions)) {
        suggestions = data.data.suggestions;
        // console.log("✅ Found suggestions in data.data.suggestions");
      } else if (data.suggestions && Array.isArray(data.suggestions)) {
        suggestions = data.suggestions;
        // console.log("✅ Found suggestions in data.suggestions");
      } else if (
        (data as any).response?.suggestions &&
        Array.isArray((data as any).response.suggestions)
      ) {
        suggestions = (data as any).response.suggestions;
        // console.log("✅ Found suggestions in data.response.suggestions");
      } else if (
        (data as any).result?.suggestions &&
        Array.isArray((data as any).result.suggestions)
      ) {
        suggestions = (data as any).result.suggestions;
        // console.log("✅ Found suggestions in data.result.suggestions");
      } else if (Array.isArray(data)) {
        suggestions = data;
        // console.log("✅ Found suggestions as direct array");
      } else {
        // console.error(
        //   "❌ No suggestions found in response. Response structure:",
        //   {
        //     hasData: !!data.data,
        //     hasSuggestions: !!data.suggestions,
        //     hasResponse: !!(data as any).response,
        //     hasResult: !!(data as any).result,
        //     isArray: Array.isArray(data),
        //     keys: Object.keys(data || {}),
        //     dataKeys: data.data ? Object.keys(data.data) : null,
        //   }
        // );
      }

      // console.log("🔍 Extracted suggestions:", {
      //   endpoint,
      //   suggestionsCount: suggestions?.length || 0,
      //   suggestionsArray: suggestions,
      //   isArray: Array.isArray(suggestions),
      //   firstSuggestion: suggestions?.[0],
      // });

      if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
        // console.log("🎯 Processing suggestions:", suggestions);

        // Clean up suggestion text and apply limits
        const processedSuggestions = suggestions
          .slice(0, aiSettings.suggestionsLimit)
          .map((text: string) => ({
            text: cleanSuggestionText(text),
            confidence: 1,
          }));

        // console.log("🎯 Final processed suggestions:", processedSuggestions);

        // Set suggestions state immediately
        setSuggestions(processedSuggestions);

        const agentInfo = suggestionsAgentId
          ? ` (Agent: ${suggestionsAgentId.substring(0, 8)})`
          : " (Default)";
        const modelInfo = ` [${aiSettings.aiConfig.model}@${aiSettings.aiConfig.temperature}]`;
        toast.success(
          `Generated ${processedSuggestions.length} suggestions${agentInfo}${modelInfo}`
        );
      } else {
        console.error("❌ Invalid or empty suggestions response:", {
          data: data,
          suggestions: suggestions,
          isArray: Array.isArray(suggestions),
          length: suggestions?.length,
        });
        toast.error(
          `No suggestions received from AI service. Response format: ${typeof data}`
        );
      }
    } catch (error) {
      console.error("Suggestions API error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get suggestions";

      // Enhanced error handling for FastAPI connectivity
      if (
        errorMessage.includes("FastAPI server") ||
        errorMessage.includes("Cannot connect") ||
        errorMessage.includes("Network error")
      ) {
        console.error("🔧 FastAPI Connection Debug:", {
          expectedUrl:
            process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000",
          error: errorMessage,
        });

        toast.error(
          <div className="space-y-2">
            <p className="font-medium">FastAPI Server Connection Failed</p>
            <p className="text-sm">The AI backend server is not responding:</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              Expected:{" "}
              {process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"}
            </code>
            <p className="text-xs text-muted-foreground">
              Start the FastAPI server with: <br />
              <code>uvicorn main:app --reload --port 8000</code>
            </p>
          </div>,
          { duration: 10000 }
        );
      } else if (
        errorMessage.includes("422") ||
        errorMessage.includes("Validation error")
      ) {
        console.error("🔧 Validation Error Debug:", {
          validMessages: getValidMessages(recentMessages).length,
        });

        toast.error(
          <div className="space-y-2">
            <p className="font-medium">Request Validation Error</p>
            <p className="text-sm">
              The AI service couldn't process your request.
            </p>
            <p className="text-xs text-muted-foreground">
              Check console for validation details.
            </p>
          </div>,
          { duration: 8000 }
        );
      } else if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        toast.error(
          <div className="space-y-2">
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">
              Unable to authenticate with the AI service.
            </p>
          </div>
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoadingType(null);
    }
  };

  const handleChatMessage = async (
    isAutonomous: boolean = false,
    newMessage?: string
  ) => {
    if (loadingType) return;

    try {
      setLoadingType(isAutonomous ? "auto" : "send");

      let messageToProcess = null;

      if (isAutonomous) {
        // Filter out messages without body content first
        const validMessages = getValidMessages(recentMessages);

        // NEW: Smart contextual response generation for new/empty conversations
        if (validMessages.length === 0) {
          // Get conversation and customer context for intelligent response generation
          const customerInfo = getCustomerInfo(recentMessages);

          // Build contextual query based on available information
          let contextualQuery =
            "Generate a personalized conversation starter based on available context";

          if (customerInfo.name) {
            contextualQuery = `Generate a personalized greeting and conversation starter for customer: ${customerInfo.name}`;
          }

          if (customerInfo.email) {
            contextualQuery += ` (Email: ${customerInfo.email})`;
          }

          // Add conversation context if available
          if (conversationId) {
            contextualQuery += `. Use conversation ID: ${conversationId} and any relevant knowledge base information to create a targeted, helpful response.`;
          }

          messageToProcess = contextualQuery;
        } else if (validMessages.length < MIN_REQUIRED_MESSAGES_AUTOPILOT) {
          // For conversations with minimal context, use customer info + conversation context
          const customerInfo = getCustomerInfo(recentMessages);
          const lastCustomerMessage = aiSettings.prioritizeCustomerMessages
            ? [...validMessages]
                .reverse()
                .find((msg) => msg.direction === "inbound")?.body
            : null;

          const lastMessage = validMessages[validMessages.length - 1]?.body;

          // Build contextual continuation query
          let contextualQuery =
            lastCustomerMessage ||
            lastMessage ||
            "Continue this conversation professionally";

          if (
            customerInfo.name &&
            !contextualQuery.includes(customerInfo.name)
          ) {
            contextualQuery = `Respond to ${customerInfo.name}: "${contextualQuery}". Use knowledge base and conversation context to provide a helpful, personalized response.`;
          }

          messageToProcess = contextualQuery;
        } else {
          // Get customer information for auto-pilot
          const customerInfo = getCustomerInfo(recentMessages);

          // For auto-pilot, try to get customer message first, then fall back to last message
          const lastCustomerMessage = aiSettings.prioritizeCustomerMessages
            ? [...validMessages]
                .reverse()
                .find((msg) => msg.direction === "inbound")?.body
            : null;

          const lastMessage = validMessages[validMessages.length - 1]?.body;
          messageToProcess = lastCustomerMessage || lastMessage;

          if (!messageToProcess) {
            throw new Error("No messages found to generate response for");
          }
        }
      }

      // For manual message sending (not auto-pilot), send the message directly via GHL API
      if (
        !isAutonomous ||
        message.trim() ||
        (newMessage && newMessage.trim())
      ) {
        // Get customer info including contactId
        const customerInfo = getCustomerInfo(recentMessages);

        // Auto-detect message type if auto-detect is enabled
        const finalMessageType =
          selectedMessageType === "AUTO_DETECT"
            ? detectConversationMessageType(recentMessages)
            : selectedMessageType;

        const buildPayload = () => {
          switch (finalMessageType.split("_")[1]) {
            case "EMAIL":
              return {
                type: "Email",
                subject: "Test Subject", // required for email
                message: message.trim() || newMessage?.trim() || "",
                contactId: customerInfo.contactId,
                attachments: [
                  {
                    url: "",
                    name: "",
                  },
                ], // optional
              };

            case "SMS":
              return {
                type: "SMS",
                message: message.trim() || newMessage?.trim() || "",
                contactId: customerInfo.contactId,
              };

            case "WHATSAPP":
              return {
                type: "WhatsApp",
                message: message.trim() || newMessage?.trim() || "",
                contactId: customerInfo.contactId,
                phone: customerInfo.phone,
              };

            case "FACEBOOK":
              return {
                type: "FB",
                message: message.trim() || newMessage?.trim() || "",
                contactId: customerInfo.contactId,
              };

            case "INSTAGRAM":
              return {
                type: "IG",
                message: message.trim() || newMessage?.trim() || "",
                contactId: customerInfo.contactId,
              };

            default:
              throw new Error(`Unsupported message type: ${finalMessageType}`);
          }
        };

        const payload = buildPayload();
        const token = await getClientGhlToken();

        // via socket
        sendMessage({
          ...payload,
          conversationId, // add if required separately
          token,
        });

        // Clear message input and reset state
        setMessage("");
        setAutoPilotResponse(null);
        setSuggestions([]);

        toast.success(
          <div className="space-y-1">
            <p className="font-medium">
              Message sent via{" "}
              {SENDABLE_MESSAGE_TYPES.find(
                (t) => t.value === selectedMessageType
              )?.label || "API"}
            </p>
          </div>
        );

        return; // Exit early for manual message sending
      }

      // Continue with AI/autopilot logic only for autonomous mode or when message is empty
      if (
        !isAutonomous ||
        !message.trim() ||
        (newMessage && newMessage.trim())
      ) {
        throw new Error("Please enter a message");
      }

      // Filter valid messages for auto-pilot context using extended depth
      const validMsgsForContext = getValidMessages(recentMessages);

      if (isAutonomous) {
        const messageCounts = getMessageCounts(true);

        // console.log("🚀 Auto-pilot message analysis:", {
        //   totalMessages: recentMessages.length,
        //   validMessages: validMsgsForContext.length,
        //   inboundCount: validMsgsForContext.filter(
        //     (m) => m.direction === "inbound"
        //   ).length,
        //   outboundCount: validMsgsForContext.filter(
        //     (m) => m.direction === "outbound"
        //   ).length,
        //   messageToProcess: messageToProcess?.substring(0, 100),
        //   customerInfo: getCustomerInfo(recentMessages),
        //   aiConfig: {
        //     model: aiSettings.aiConfig.model,
        //     temperature: aiSettings.aiConfig.temperature,
        //     humanlikeBehavior: aiSettings.aiConfig.humanlikeBehavior,
        //   },
        //   settings: {
        //     recentConfigured: aiSettings.recentMessagesCount,
        //     recentActual: messageCounts.recentActual,
        //     contextConfigured: aiSettings.contextDepth,
        //     contextActual: messageCounts.contextActual,
        //     includeEmails: aiSettings.includeEmailMessages,
        //     prioritizeCustomer: aiSettings.prioritizeCustomerMessages,
        //     extendedForMinimum: messageCounts.extendedForMinimum,
        //   },
        //   sampleValidMessages: validMsgsForContext.slice(0, 3).map((m) => ({
        //     id: m.id,
        //     body: m.body?.substring(0, 50),
        //     direction: m.direction,
        //     messageType: m.messageType,
        //     hasBody: !!m.body?.trim(),
        //   })),
        // });
      }

      // Get recent messages ensuring minimum count
      const recentMsgsFiltered = getMessagesWithMinimum(
        recentMessages,
        aiSettings.recentMessagesCount,
        isAutonomous
      );

      const recentMsgs = recentMsgsFiltered.map((msg) => ({
        id: msg.id,
        body: msg.body,
        dateAdded: msg.dateAdded,
        locationId: msg.locationId || locationId,
        contactId: msg.contactId || "",
        conversationId: msg.conversationId || conversationId,
        direction: msg.direction,
        messageType: msg.messageType || "TYPE_SMS",
        contentType: "text/plain",
        status: msg.status || "delivered",
        type: typeof msg.type === "string" ? 0 : msg.type || 0,
        role: msg.direction
          ? msg.direction === "inbound"
            ? "customer"
            : "system user"
          : "system notification",
        source: msg.source || "chat",
      }));

      // Get customer info for the request
      const customerInfoForRequest = getCustomerInfo(recentMessages);

      // NEW: Detect conversation state and enhance prompting for autopilot
      const isNewConversation = validMsgsForContext.length === 0;
      const hasMinimalContext =
        validMsgsForContext.length < 3 && validMsgsForContext.length > 0;

      let enhancedContext = "";
      let enhancedQuery = isAutonomous ? messageToProcess : message.trim();

      if (isAutonomous && isNewConversation) {
        // console.log(
        //   "🆕 Autopilot: New conversation detected - using conversation starter prompting"
        // );

        enhancedContext = `This is a brand new conversation with no prior messages. As an autopilot AI assistant, generate a professional conversation starter that:
1. Provides a warm, professional greeting appropriate for business communication
2. Introduces yourself or your services briefly
3. Asks an engaging question to understand the customer's needs
4. Sounds natural and encourages customer engagement
5. Sets a positive tone for the conversation

Focus on being welcoming, professional, and value-driven. This is the first message in the conversation.`;

        enhancedQuery =
          "Generate a professional greeting and conversation starter for this new business conversation";
      } else if (isAutonomous && hasMinimalContext) {
        // console.log(
        //   "📝 Autopilot: Minimal context detected - using relationship building prompting"
        // );

        enhancedContext = `This conversation has minimal context (${validMsgsForContext.length} messages). As an autopilot AI assistant, generate a response that:
1. Acknowledges any previous messages appropriately
2. Builds rapport and trust with the customer
3. Asks relevant follow-up questions to understand their needs
4. Provides helpful information or next steps
5. Maintains a professional and engaging tone

Focus on relationship building and moving the conversation forward constructively.`;
      } else if (isAutonomous) {
        // console.log(
        //   "💬 Autopilot: Standard context - using contextual response prompting"
        // );

        enhancedContext = `Generate a helpful and contextually appropriate response that:
1. Addresses the customer's most recent message directly
2. Provides relevant and valuable information
3. Moves the conversation toward a positive outcome
4. Maintains professionalism while being personable
5. Includes appropriate next steps or calls to action`;
      }

      const requestPayload = {
        userId: USER_ID,
        conversationId,
        knowledgebaseId: conversationId,
        context:
          enhancedContext ||
          (() => {
            const contextMsgs = getMessagesWithMinimum(
              recentMessages,
              aiSettings.contextDepth,
              isAutonomous
            );
            return contextMsgs.length > 0
              ? contextMsgs
                  .map(
                    (msg) =>
                      `${msg.direction === "inbound" ? "Customer" : "Agent"}: ${
                        msg.body
                      }`
                  )
                  .join("\n")
              : "No message content available";
          })(),
        lastCustomerMessage: enhancedQuery,
        customerInfo: {
          name:
            customerInfoForRequest.name ||
            customerInfoForRequest.contactName ||
            customerInfoForRequest.fullName,
          email: customerInfoForRequest.email,
          phone: customerInfoForRequest.phone,
          contactId: customerInfoForRequest.contactId,
        },
        recentMessages: recentMsgs,
        autopilot: isAutonomous,
        limit: aiSettings.suggestionsLimit,
        agentId: "", // Will be set below
        // NEW: Add conversation metadata for better AI understanding
        conversationMetadata: {
          isNew: isNewConversation,
          hasMinimalContext: hasMinimalContext,
          validMessageCount: validMsgsForContext.length,
          enhancedPrompting:
            isAutonomous && (isNewConversation || hasMinimalContext),
          autopilotMode: isAutonomous,
        },
      };

      // console.log("🤖 Auto-pilot API request payload:", {
      //   userId: requestPayload.userId,
      //   conversationId: requestPayload.conversationId,
      //   contextLength: requestPayload.context?.length || 0,
      //   lastCustomerMessageLength:
      //     requestPayload.lastCustomerMessage?.length || 0,
      //   recentMessagesCount: requestPayload.recentMessages.length,
      //   customerInfo: requestPayload.customerInfo,
      //   autopilot: requestPayload.autopilot,
      //   aiConfig: {
      //     model: aiSettings.aiConfig.model,
      //     temperature: aiSettings.aiConfig.temperature,
      //     humanlikeBehavior: aiSettings.aiConfig.humanlikeBehavior,
      //   },
      //   messagesSample: requestPayload.recentMessages.slice(0, 2).map((m) => ({
      //     id: m.id,
      //     direction: m.direction,
      //     bodyPreview: m.body?.substring(0, 50) + "...",
      //     messageType: m.messageType,
      //   })),
      // });

      // Use agent-aware endpoint if we have a selected agent
      let endpoint = "/api/ai/conversation/response-suggestions"; // fallback to direct endpoint
      let agentRequestPayload = requestPayload;

      // Get the agent ID for autopilot feature (new structure or backward compatibility)
      const autopilotAgentId =
        conversationSettings?.agents?.autopilot ||
        (conversationSettings?.agentType === "response"
          ? conversationSettings?.selectedAgentId
          : null);

      if (
        autopilotAgentId &&
        (isAutonomous
          ? conversationSettings?.features?.autopilot?.enabled !== false
          : true)
      ) {
        // Use agent-aware endpoint with selected agent
        endpoint = "/api/ai/agents/conversation";
        agentRequestPayload = {
          ...requestPayload,
          agentId: autopilotAgentId,
          query: isAutonomous ? messageToProcess : message.trim(),
          mode: isAutonomous ? "autopilot" : "response",
        } as any;

        // console.log("🤖 Using selected agent for auto-pilot:", {
        //   selectedAgentId: autopilotAgentId,
        //   endpoint: endpoint,
        //   isAutonomous,
        //   featuresEnabled: conversationSettings?.features?.autopilot?.enabled,
        //   confidenceThreshold:
        //     conversationSettings?.features?.autopilot?.confidenceThreshold,
        //   aiModel: aiSettings.aiConfig.model,
        //   temperature: aiSettings.aiConfig.temperature,
        // });
      } else {
        // Always include agent ID even for direct endpoint
        (requestPayload as any).agentId = autopilotAgentId || null;
        // console.log(
        //   "🤖 No autopilot agent selected, using direct FastAPI endpoint with default agent"
        // );
      }

      const data = await callApi<ChatResponse>(
        endpoint,
        agentRequestPayload,
        isAutonomous ? "autopilot" : "suggestions"
      );

      if (
        isAutonomous &&
        (data.data?.autopilot_response || data.data?.response_suggestion)
      ) {
        // Use autopilot_response for auto-pilot mode, or fallback to response_suggestion
        const formattedResponse = (
          data.data.autopilot_response ||
          data.data.response_suggestion ||
          ""
        ).trim();

        // Check confidence threshold
        const confidence = data.data.confidence_score || 0;
        if (confidence < aiSettings.confidenceThreshold) {
          toast.warning(
            `AI response generated with low confidence (${Math.round(
              confidence * 100
            )}%). Consider reviewing before sending.`
          );
        }

        setAutoPilotResponse(formattedResponse);
        setMessage(formattedResponse);

        // REMOVED: Auto-training after AI response generation
        // if (recentMessages.length > 0) {
        //   console.log('🤖 AUTO-TRAIN: Training conversation after AI response generation...');
        //   startBackgroundTraining();
        // }

        const agentInfo = conversationSettings?.selectedAgentId
          ? " (using selected agent)"
          : "";
        const modelInfo = ` [${aiSettings.aiConfig.model}@${aiSettings.aiConfig.temperature}]`;
        toast.success(
          <div className="space-y-2 max-w-[350px]">
            <p className="font-medium">
              AI Response Generated{agentInfo}
              {modelInfo}
            </p>
            <p className="text-sm opacity-90 line-clamp-4 leading-relaxed">
              {formattedResponse}
            </p>
            <div className="text-xs opacity-75 space-y-1">
              {customerInfoForRequest.name && (
                <p>• Customer: {customerInfoForRequest.name}</p>
              )}
              <p>
                • Using {recentMsgs.length} valid messages (of{" "}
                {recentMessages.length} total)
              </p>
              <p>• Latest message: {recentMsgs[0]?.body.slice(0, 50)}...</p>
              {confidence && (
                <p>• Confidence: {Math.round(confidence * 100)}%</p>
              )}
              <p>• Model: {aiSettings.aiConfig.model}</p>
              <p>• Temperature: {aiSettings.aiConfig.temperature}</p>
              {conversationSettings?.selectedAgentId && (
                <p>
                  • Agent:{" "}
                  {conversationSettings.selectedAgentId.substring(0, 8)}...
                </p>
              )}
            </div>
          </div>
        );
      } else if (!isAutonomous) {
        // Handle regular message sending (not auto-pilot)
        setSuggestions([]);
        setMessage("");
        setAutoPilotResponse(null);
        toast.success("Message sent");
      } else {
        // Auto-pilot mode but no response received
        throw new Error("No response received from AI service");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process message"
      );
    } finally {
      setLoadingType(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingType || !message.trim()) return;

    handleChatMessage(false); // existing logic
  };

  // Load conversation settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(
          `/api/conversation-meta?conversationId=${conversationId}`
        );
        const data = await response.json();

        if (data.success && data.data?.data) {
          setConversationSettings(data.data.data);
          // console.log("Loaded conversation settings for MessageInput:", {
          //   selectedAgentId: data.data.data.selectedAgentId,
          //   agentType: data.data.data.agentType,
          // });
        } else {
          // console.log(
          //   "No conversation settings found for MessageInput, will use default agent"
          // );
        }
      } catch (error) {
        // console.error("Error loading conversation settings:", error);
        // Continue without settings - will use default agent
      }
    };

    const loadAutopilotStatus = async () => {
      try {
        const response = await fetch(
          `/api/autopilot/config?conversationId=${conversationId}`
        );
        if (response.ok) {
          const data = await response.json();
          // Load the actual autopilot status from the server

          // console.log(
          //   "🤖 Loaded autopilot status:",
          //   data.enabled || data.config?.isEnabled || false
          // );
        }
      } catch (error) {
        console.error("Error loading autopilot status:", error);
      }
    };

    loadSettings();
    loadAutopilotStatus();
  }, [conversationId]);

  // Update selected message type when conversation type or messages change
  useEffect(() => {
    const defaultType = getDefaultMessageType(conversationType, recentMessages);
    setSelectedMessageType(defaultType);

    // console.log('🔄 Message type detection:', {
    //   conversationType,
    //   detectedType: defaultType,
    //   recentMessagesCount: recentMessages.length,
    //   availableTypes: getAvailableMessageTypes(conversationType, recentMessages).map(t => t.label)
    // });
  }, [conversationType, recentMessages]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (trainingTimeoutRef.current) {
        clearTimeout(trainingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Compact Suggestions Display */}

      {suggestions.length > 0 && (
        <div className="mb-3">
          <div className="bg-card rounded-lg border border-secondary/30 shadow-sm overflow-hidden max-h-[40vh]">
            <div className="px-3 py-2 bg-gradient-to-r from-secondary/10 to-secondary/5 border-b border-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-secondary" />
                  <span className="text-xs font-medium text-secondary">
                    AI Suggestions
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 h-4"
                  >
                    {suggestions.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuggestions([])}
                  className="h-5 w-5 p-0 hover:bg-secondary/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-[30vh] overflow-y-auto">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoadingType("apply");
                    handleMessageChange(suggestion.text, true);
                    setSuggestions([]);
                    setTimeout(() => {
                      textareaRef.current?.focus();
                      setLoadingType(null);
                      toast.success("Suggestion applied");
                    }, 200);
                  }}
                  disabled={loadingType === "apply"}
                  className="w-full text-left justify-start h-auto py-2 px-3 hover:bg-secondary/10 hover:border-secondary/30"
                >
                  <div className="flex items-start gap-2 w-full">
                    <span className="text-xs text-secondary font-medium mt-0.5 shrink-0 bg-secondary/20 rounded px-1 py-0.5 min-w-[16px] text-center">
                      {i + 1}
                    </span>
                    {loadingType === "apply" ? (
                      <div className="flex items-center gap-2 text-xs">
                        <LoadingSpinner className="h-3 w-3" />
                        <span>Applying...</span>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs leading-relaxed text-left line-clamp-3">
                            {suggestion.text}
                          </span>
                        </TooltipTrigger>
                        {suggestion.text.length > 100 && (
                          <TooltipContent className="max-w-[400px] whitespace-normal">
                            <p className="text-xs leading-relaxed">
                              {suggestion.text}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </Button>
              ))}

              <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                💡 Click to apply
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ultra Compact AI Tools - Single Row */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              AI Tools:
            </span>

            {/* Auto Response */}
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={autopilotEnabled ? "default" : "outline"}
                  onClick={handleAutopilotToggle}
                  className="h-7 w-7 p-0"
                >
                  <Bot
                    className={cn(
                      "h-3 w-3",
                      autopilotEnabled && "text-green-400"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Auto Response {autopilotEnabled ? "ON" : "OFF"}
              </TooltipContent>
            </Tooltip> */}

            {/* Quick Response */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChatMessage(true)}
                  disabled={loadingType === "auto"}
                  className="h-7 w-7 p-0"
                >
                  {loadingType === "auto" ? (
                    <LoadingSpinner className="h-3 w-3" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Quick Response</TooltipContent>
            </Tooltip>

            {/* Ask AI */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={showQueryInput ? "default" : "outline"}
                  onClick={() =>
                    onToggleQuery && onToggleQuery(!showQueryInput)
                  }
                  className="h-7 w-7 p-0"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ask AI Questions</TooltipContent>
            </Tooltip>

            {/* Suggestions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGetSuggestions}
                  disabled={loadingType === "suggest"}
                  className="h-7 w-7 p-0"
                >
                  {loadingType === "suggest" ? (
                    <LoadingSpinner className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Get Suggestions</TooltipContent>
            </Tooltip>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {!isConversationTrained && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">
                Ready
              </Badge>
            )}
            {isConversationTrained && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">
                Enhanced
              </Badge>
            )}
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                {suggestions.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Improved Message Composer */}
      <div className="border-t border-border/30 bg-background">
        <div className="p-4 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                {/* <ChatPage /> */}
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  placeholder={
                    hasUnsavedChanges
                      ? "AI response ready - edit or send as-is"
                      : "Type your message..."
                  }
                  disabled={disabled || loadingType !== null}
                  className={cn(
                    "min-h-Suggestionsone border-border/50 focus:border-primary/50",
                    hasUnsavedChanges && "border-primary/50 bg-primary/5"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (message.trim() && !disabled && loadingType === null) {
                        handleSubmit(e);
                      }
                    }
                  }}
                />
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                {/* Message Type Selector */}
                {/* <Select
                  value={selectedMessageType}
                  onValueChange={setSelectedMessageType}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>




                    {getAvailableMessageTypes(conversationType, recentMessages).map((type) => (
                      <SelectItem key={type.internal} value={type.internal} className="text-xs">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}

                <Select
                  value={selectedMessageType}
                  onValueChange={setSelectedMessageType}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableMessageTypes(messagesList).map((type) => (
                      <SelectItem
                        key={type.internal}
                        value={type.internal}
                        className="text-xs"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* 
  <Select
  value={selectedMessageType}
  onValueChange={setSelectedMessageType}
>
  <SelectTrigger className="w-24 h-8 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {getAvailableMessageTypes(conversationType, recentMessages).map((type) => {
      const isDisabled = conversationType ? type.internal !== conversationType : false;
      
      return (
        <SelectItem 
          key={type.internal} 
          value={type.internal} 
          className="text-xs"
          disabled={isDisabled}
        >
          <div className="flex flex-col">
            <span>{type.label}</span>
            {isDisabled && (
              <span className="text-xs text-muted-foreground">
                Not available for this conversation type
              </span>
            )}
          </div>
        </SelectItem>
      );
    })}
  </SelectContent>
</Select> */}

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={disabled || loadingType !== null}
                  size="sm"
                  className="h-8 px-3 min-w-[60px]"
                >
                  {loadingType === "send" ? (
                    <LoadingSpinner className="h-3 w-3" />
                  ) : (
                    <span className="text-xs">Send</span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* AI Response Actions */}
          {hasUnsavedChanges && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bot className="h-3 w-3" />
                <span>AI response ready</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMessage("");
                    setAutoPilotResponse(null);
                    setSuggestions([]);
                  }}
                  className="h-7 px-3 text-xs"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetSuggestions}
                  disabled={loadingType === "suggest"}
                  className="h-7 px-3 text-xs"
                >
                  {loadingType === "suggest" ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    "More"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Information - Minimal */}
      {(() => {
        const counts = getMessageCounts(false);
        if (!counts.hasValidMessages) {
          return (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground">
                No conversation history found
              </p>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
