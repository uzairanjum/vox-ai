"use client";

import { useState, useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { MessageInput } from "./MessageInput";
import { QueryInput } from "./QueryInput";
import { Message } from "@/lib/leadconnector/types/messageTypes";
import { TrainingStatus } from "./types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

import {
  MessageCircle,
  ChevronUp,
  X,
  Search,
  CheckCircle,
  Train,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AutopilotFloatingButton } from "./components/AutopilotFloatingButton";
import { getFeatureAIConfig } from "@/utils/ai/config/aiSettings";

import { loadEmailContent } from "@/utils/ghl/emailClient";

import { useSocket } from "../../../../context/SocketProvider";

interface ConversationHeaderProps {
  contact: Contact;
  children?: React.ReactNode;
}
// api/email.ts
export interface EmailContent {
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
  direction: string;
  status: string;
}

// Message type labels only (removed icons for cleaner UI)
const messageTypeLabels: Record<string, string> = {
  TYPE_SMS: "SMS",
  TYPE_WEBCHAT: "Web Chat",
  TYPE_EMAIL: "Email",
  TYPE_PHONE: "Phone",
  TYPE_FACEBOOK: "FaceBooK",
  TYPE_INSTAGRAM: "Instagram",
  TYPE_GMB: "Custom",
  // TYPE_ACTIVITY_CONTACT: 'Activity',
  TYPE_WHATSAPP: "WhatsApp",
};

interface ConversationDetailsProps {
  conversationId: string;
  locationId: string;
  tag: string;
}

interface Contact {
  name?: string;
  email?: string;
  phone?: string;
}

// Enhanced debug helper with better error formatting
const debug = {
  log: (component: string, message: string, data?: any) => {
    // console.log(`[${component}] ${message}`, data || "");
  },
  warn: (component: string, message: string, data?: any) => {
    console.warn(`[${component}] ${message}`, data || "");
  },
  error: (component: string, message: string, data?: any) => {
    console.error(`[${component}] ${message}`, data || "");
  },
};

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
// API helper with debug logging
async function fetchWithDebug(url: string, options?: RequestInit) {
  const requestId = Math.random().toString(36).substring(7);
  debug.log("API", `Request ${requestId} to ${url}`, options);

  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    const endTime = performance.now();
    debug.log(
      "API",
      `Response ${requestId} received in ${Math.round(endTime - startTime)}ms`,
      {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      }
    );

    // Get raw response text first
    const rawText = await response.text();
    debug.log("API", `Raw response ${requestId}:`, rawText);

    // Try parsing JSON
    let data;
    try {
      data = JSON.parse(rawText);
      debug.log("API", `Parsed response ${requestId}:`, data);
    } catch (parseError) {
      debug.error("API", `Failed to parse JSON for ${requestId}:`, parseError);
      throw new Error(`Invalid JSON response: ${rawText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      throw new Error(
        `API error (${response.status}): ${data?.error || response.statusText}`
      );
    }

    return data;
  } catch (error) {
    debug.error("API", `Failed request ${requestId}:`, error);
    throw error;
  }
}

// Helper function to get avatar letter for customer
function getCustomerAvatarLetter(
  message: Message,
  urlContactInfo: Contact
): string {
  // Priority order: URL contact info, message contact info, first letter of email, 'C' fallback
  const name = urlContactInfo.name || message.contactName || message.fullName;
  if (name) {
    return name.charAt(0).toUpperCase();
  }

  const email = urlContactInfo.email || message.email;
  if (email) {
    return email.charAt(0).toUpperCase();
  }

  return "C";
}

function MessageBubble({
  message,
  isLast,
  urlContactInfo,
}: {
  message: Message;
  isLast: boolean;
  urlContactInfo: Contact;
}) {
  const getSafeBody = (msg: any): string => {
    if (!msg) return "";

    // Handle nested body object
    if (msg.body && typeof msg.body === "object") {
      // Check common locations for the actual message text
      if (msg.body.text && typeof msg.body.text === "string") {
        return msg.body.text.trim();
      }
      if (msg.body.body && typeof msg.body.body === "string") {
        return msg.body.body.trim();
      }
      if (msg.body.message && typeof msg.body.message === "string") {
        return msg.body.message.trim();
      }
      // If we can't find the text, return empty string
      return "";
    }

    // Handle flat structure (body is string)
    const body = msg.body ?? msg.message;

    if (typeof body === "string") {
      return body.trim();
    }

    return String(body ?? "");
  };

  const isInbound = message.direction === "inbound";
  const formattedDate = format(new Date(message.dateAdded), "MMM d, h:mm a");
  const isActivity = message.messageType === "TYPE_ACTIVITY_CONTACT";
  const [emailBody, setEmailBody] = useState<string | null>(null);
  // const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  const { socket } = useSocket();

  useEffect(() => {
    const load = async () => {
      if (
        message.messageType === "TYPE_EMAIL" &&
        message.meta?.email?.messageIds?.length
      ) {
        const emailId = message.meta.email.messageIds[0];
        if (emailContent || isLoadingEmail) return;
        setIsLoadingEmail(true);
        try {
          const content = await loadEmailContent(emailId);
          setEmailContent(content);
        } catch (err) {
          console.error("Failed to load email:", err);
          // setEmailContent({ subject: "", body: "[Error loading email]", from: "", to:"", date: "" });
        } finally {
          setIsLoadingEmail(false);
        }
      }
    };
    load();
  }, [message]);

  // Load email content for TYPE_EMAIL messages
  useEffect(() => {
    // const loadEmail = async () => {
    //   if (message.messageType === "TYPE_EMAIL" && message.meta?.email?.messageIds?.length) {
    //     const emailId = message.meta.email.messageIds[0];
    //     // Only load if not already loaded or loading
    //     if (emailContent || isLoadingEmail) return;
    //     setIsLoadingEmail(true);
    //     try {
    //       const content = await loadEmailContent(emailId);
    //       setEmailContent(content);
    //     } catch (error) {
    //       console.error('Failed to load email content:', error);
    //       setEmailContent({
    //         body: "[Failed to load email content]",
    //         subject: "",
    //         from: "",
    //         to: "",
    //         date: ""
    //       });
    //     } finally {
    //       setIsLoadingEmail(false);
    //     }
    //   }
    // };
    // loadEmail();
  }, [message.messageType, message.meta?.email?.messageIds]);
  // Debug log for webchat messages
  if (message.messageType === "TYPE_WEBCHAT") {
    // console.log("Rendering TYPE_WEBCHAT message:", {
    //   id: message.id,
    //   direction: message.direction,
    //   hasBody: !!message.body,
    //   bodyLength: message.body?.length,
    //   bodyPreview: message.body?.substring(0, 100) + "...",
    //   messageType: message.messageType,
    // });
  }

  // For activity messages, show them centered with different styling
  if (isActivity) {
    return (
      <div className="flex justify-center my-2 px-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs">
          <span>{message.body}</span>
          <span className="opacity-50">•</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    );
  }

  // Parse contact info from webchat messages
  let contactInfo = null;
  if (
    message.messageType === "TYPE_WEBCHAT" &&
    message.body.includes("Contact Information:")
  ) {
    try {
      // Try both actual newlines (\n) and escaped newlines (\\n) to handle different formats
      const splitChar = message.body.includes("\n") ? "\n" : "\\n";
      contactInfo = message.body.split(splitChar).reduce((acc, line) => {
        const [key, value] = line.split(": ");
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {} as Record<string, string>);

      // console.log("Parsed webchat contact info:", {
      //   splitChar: splitChar === "\n" ? "actual newlines" : "escaped newlines",
      //   originalBody: message.body,
      //   parsedInfo: contactInfo,
      // });
    } catch (e) {
      console.error("Failed to parse contact info:", e);
      // If parsing fails, still show the raw message
      contactInfo = null;
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        isInbound ? "justify-start" : "justify-end"
      )}
    >
      {/* Customer Avatar - Left side for inbound messages */}
      {isInbound && (
        <Avatar className="h-8 w-8 mt-2 flex-shrink-0">
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 h-full w-full flex items-center justify-center rounded-full text-sm font-medium">
            {getCustomerAvatarLetter(message, urlContactInfo)}
          </div>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col gap-1 min-w-0 max-w-[85%]",
          !isInbound && "items-end"
        )}
      >
        {/* Message type badge - simplified */}
        <div
          className={cn(
            "flex items-center gap-2 mb-1 text-xs",
            !isInbound && "flex-row-reverse"
          )}
        >
          {Array.isArray(message.messageType)
            ? message.messageType
                .filter((type) => messageTypeLabels[type]) // ✅ only keep known types
                .map((type) => (
                  <Badge key={type} variant="outline" className="h-5 px-2">
                    {messageTypeLabels[type]}
                  </Badge>
                ))
            : messageTypeLabels[message.messageType] && ( // ✅ only render if valid
                <Badge variant="outline" className="h-5 px-2">
                  {messageTypeLabels[message.messageType]}
                </Badge>
              )}
          {/* <Badge variant="outline" className="h-5 px-2">

            {messageTypeLabels[message.messageType] || message.messageType}
          </Badge> */}
        </div>

        {/* Message content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 break-words",
            isInbound
              ? "bg-muted text-foreground"
              : "bg-primary text-primary-foreground",
            isLast && "mb-2"
          )}
        >
          {/* For webchat contact info, format it nicely */}
          {/* For email messages, show the fetched email content */}

          {message.messageType === "TYPE_EMAIL" ? (
            <div className="space-y-3">
              {isLoadingEmail ? (
                <div className="flex items-center justify-center">
                  {/* <LoadingSpinner className="w-4 mr-2" /> */}
                  <span className="text-sm">Loading email...</span>
                </div>
              ) : emailContent ? (
                <div className="max-w-full">
                  {/* Email header */}

                  {/* Email body */}
                  <div
                    className="prose prose-sm max-w-none  email-content"
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      fontSize: "14px",
                      lineHeight: "1.4",
                    }}
                    dangerouslySetInnerHTML={{ __html: emailContent.body }}
                  />

                  {/* Email status */}
                  {/* <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-gray-100">
                    Status: {emailContent.status} | Direction: {emailContent.direction}
                  </div> */}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No email content available
                </div>
              )}
            </div>
          ) : contactInfo ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground opacity-75">
                Contact Form Submission
              </div>
              {contactInfo.Name && (
                <div className="font-medium text-base">{contactInfo.Name}</div>
              )}
              {contactInfo.Phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📞</span>
                  <span className="font-mono">{contactInfo.Phone}</span>
                </div>
              )}
              {contactInfo.Email && (
                <div className="flex items-center gap-2 text-sm">
                  <span>✉️</span>
                  <span>{contactInfo.Email}</span>
                </div>
              )}
              {contactInfo.Message && (
                <div className="mt-3 pt-3 border-t border-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">
                    Message:
                  </div>
                  <div className="text-sm leading-relaxed">
                    {contactInfo.Message}
                  </div>
                </div>
              )}
            </div>
          ) : message.messageType === "TYPE_WEBCHAT" ? (
            // Enhanced display for webchat messages that couldn't be parsed
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground opacity-75">
                Web Chat Message
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {getSafeBody(message)}
              </div>
            </div>
          ) : (
            // Regular message display
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {getSafeBody(message)}
            </div>
          )}
        </div>

        {/* Metadata - simplified */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 text-xs text-muted-foreground",
            !isInbound && "flex-row-reverse"
          )}
        >
          <span>{formattedDate}</span>
          {message.status && (
            <>
              <span>•</span>
              <span className="capitalize">{message.status}</span>
            </>
          )}
        </div>
      </div>

      {/* System User Avatar - Right side for outbound messages */}
      {!isInbound && (
        <Avatar className="h-8 w-8 mt-2 flex-shrink-0">
          <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center rounded-full text-sm font-medium">
            S
          </div>
        </Avatar>
      )}
    </div>
  );
}

function ConversationHeader({ contact, children }: ConversationHeaderProps) {
  if (!contact) return null;
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <div className="bg-primary/10 text-primary h-full w-full flex items-center justify-center rounded-full text-lg font-medium">
            {contact.name?.[0] || "C"}
          </div>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">
            {contact.name || "Unknown Contact"}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {contact.email && <span>{contact.email}</span>}
            {contact.email && contact.phone && <span>•</span>}
            {contact.phone && <span>{contact.phone}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
interface Agent {
  id: string;
  created_at: string;
  name: string;
  type: number;
  description?: string;
  is_active?: boolean;
  user_id: string;
  model?: string;
}

export function ConversationDetails({
  conversationId,
  tag,
  locationId,
}: ConversationDetailsProps) {
  // URL params
  const searchParams = useSearchParams();

  const urlContactInfo = {
    name: searchParams.get("contact") || undefined,
    email: searchParams.get("email") || undefined,
    phone: searchParams.get("phone") || undefined,
  };

  // State
  const [messages, setMessages] = useState<any[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(
    null
  );
  const [showQueryInput, setShowQueryInput] = useState(false);

  const [newMessage, setNewMessage] = useState<any>("");

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | undefined>();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🆕 Add request deduplication
  const [isTrainingInProgress, setIsTrainingInProgress] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  const { socket } = useSocket();

  // Add disabled state for UI interactions
  const disabled = isLoading || isRegeneratingSummary;

  // Conversation settings state
  const [conversationSettings, setConversationSettings] = useState<any>(null);

  // 🆕 Check FastAPI Health - moved inside component
  // const checkFastAPIHealth = async () => {
  //   try {
  //     debug.log("ConversationDetails", "Checking FastAPI health...");

  //     const healthResponse = await fetch("/api/ai/health", {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //     });

  //     const healthData = await healthResponse.json();

  //     if (healthResponse.ok && healthData.success) {
  //       setFastApiStatus({
  //         isOnline: true,
  //         lastChecked: new Date().toISOString(),
  //       });
  //       debug.log("ConversationDetails", "FastAPI is online and healthy");
  //     } else {
  //       throw new Error(
  //         healthData.error || `Health check failed: ${healthResponse.status}`
  //       );
  //     }
  //   } catch (error) {
  //     const errorMessage =
  //       error instanceof Error ? error.message : "Unknown error";
  //     setFastApiStatus({
  //       isOnline: false,
  //       lastChecked: new Date().toISOString(),
  //       error: errorMessage,
  //     });
  //     debug.error(
  //       "ConversationDetails",
  //       "FastAPI health check failed:",
  //       errorMessage
  //     );
  //   }
  // };

  const extractMessagesFromResponse = (messagesData: any) => {
    let pageMessages = [];

    if (messagesData?.success && messagesData?.data) {
      // New standardized format: { success: true, data: { messages: { messages: [...] } } }
      if (messagesData.data.messages?.messages) {
        pageMessages = messagesData.data.messages.messages;
        debug.log(
          "ConversationDetails",
          "Using standardized format - nested messages"
        );
      }
      // Alternative format: { success: true, data: { messages: [...] } }
      else if (Array.isArray(messagesData.data.messages)) {
        pageMessages = messagesData.data.messages;
        debug.log(
          "ConversationDetails",
          "Using standardized format - direct messages array"
        );
      }
      // Direct data format: { success: true, data: [...] }
      else if (Array.isArray(messagesData.data)) {
        pageMessages = messagesData.data;
        debug.log(
          "ConversationDetails",
          "Using standardized format - data is messages array"
        );
      }
    }
    // Legacy format: { messages: { messages: [...] } }
    else if (messagesData?.messages?.messages) {
      pageMessages = messagesData.messages.messages;
      debug.log("ConversationDetails", "Using legacy format");
    }
    // Direct messages array
    else if (Array.isArray(messagesData?.messages)) {
      pageMessages = messagesData.messages;
      debug.log("ConversationDetails", "Using direct messages array");
    }
    // Root level messages array
    else if (Array.isArray(messagesData)) {
      pageMessages = messagesData;
      debug.log("ConversationDetails", "Using root level messages array");
    }

    // Sort messages by dateAdded in ASCENDING order (oldest first, newest last)
    return pageMessages.sort((a: any, b: any) => {
      const dateA = new Date(a.dateAdded || a.dateAdded || 0).getTime();
      const dateB = new Date(b.dateAdded || b.dateAdded || 0).getTime();
      return dateA - dateB;
    });
  };

  // Load conversation settings
  const loadConversationSettings = async () => {
    try {
      const response = await fetch(
        `/api/conversation-meta?conversationId=${conversationId}`
      );
      const data = await response.json();

      if (data.success && data.data?.data) {
        const settings = data.data.data;
        setConversationSettings(settings);
        // console.log("🎯 Loaded conversation settings:", settings);

        // If we have agent IDs, load the actual agent details
        if (settings.agents) {
          const agentPromises = [];

          if (settings.agents.query) {
            agentPromises.push(
              fetch(`/api/ai/agents/${settings.agents.query}`)
                .then((res) => res.json())
                .then((data) => ({
                  type: "query",
                  agent: data.success ? data.agent : null,
                }))
            );
          }

          if (settings.agents.suggestions) {
            agentPromises.push(
              fetch(`/api/ai/agents/${settings.agents.suggestions}`)
                .then((res) => res.json())
                .then((data) => ({
                  type: "suggestions",
                  agent: data.success ? data.agent : null,
                }))
            );
          }

          if (settings.agents.autopilot) {
            agentPromises.push(
              fetch(`/api/ai/agents/${settings.agents.autopilot}`)
                .then((res) => res.json())
                .then((data) => ({
                  type: "autopilot",
                  agent: data.success ? data.agent : null,
                }))
            );
          }

          if (agentPromises.length > 0) {
            const agentDetails = await Promise.all(agentPromises);
            const agentMap: any = {};

            agentDetails.forEach(({ type, agent }) => {
              if (agent) {
                agentMap[type] = agent;
              }
            });

            setConversationSettings((prev: any) => ({
              ...prev,
              agentDetails: agentMap,
            }));

            // console.log("🤖 Loaded agent details:", agentMap);
          }
        }
      } else {
        // console.log("📝 No conversation settings found, will use defaults");
        setConversationSettings(null);
      }
    } catch (error) {
      console.error("❌ Error loading conversation settings:", error);
      setConversationSettings(null);
    } finally {
    }
  };

  // Background function to handle auto-training
  // async function handleAutoTraining(messageCount: number) {
  //   try {
  //     if (messageCount < 5) {
  //       debug.log(
  //         "ConversationDetails",
  //         "AUTO-TRAIN: Not enough messages for training",
  //         { messageCount }
  //       );
  //       setTrainingStatus({
  //         isTrained: false,
  //         lastUpdated: new Date().toISOString(),
  //         messageCount,
  //         vectorCount: 0,
  //       });
  //       return;
  //     }

  //     debug.log(
  //       "ConversationDetails",
  //       "AUTO-TRAIN: Checking training status..."
  //     );

  //     // Check current training status
  //     const aiConfig = getFeatureAIConfig("training");
  //     const statusData = await fetchWithDebug(
  //       `/api/ai/conversation/training-status`,
  //       {
  //         method: "POST",
  //         body: JSON.stringify({
  //           conversationId,
  //           locationId,
  //           temperature: aiConfig.temperature,
  //           model: aiConfig.model,
  //           humanlikeBehavior: aiConfig.humanlikeBehavior,
  //         }),
  //       }
  //     );

  //     const isCurrentlyTrained = statusData?.is_trained || false;
  //     const lastUpdated = statusData?.last_updated;

  //     setTrainingStatus({
  //       isTrained: isCurrentlyTrained,
  //       lastUpdated: lastUpdated || new Date().toISOString(),
  //       messageCount: statusData?.message_count || messageCount,
  //       vectorCount: statusData?.vector_count || 0,
  //     });

  //     // Auto-train if not trained or if training is outdated (7+ days old)
  //     const shouldAutoTrain =
  //       !isCurrentlyTrained ||
  //       (lastUpdated &&
  //         new Date(lastUpdated) <
  //           new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  //     if (shouldAutoTrain) {
  //       debug.log(
  //         "ConversationDetails",
  //         "AUTO-TRAIN: Starting background training..."
  //       );

  //       // Set training status to indicate training in progress
  //       setTrainingStatus((prev) =>
  //         prev
  //           ? {
  //               ...prev,
  //               isTraining: true,
  //             }
  //           : {
  //               isTrained: false,
  //               isTraining: true,
  //               lastUpdated: new Date().toISOString(),
  //               messageCount,
  //               vectorCount: 0,
  //             }
  //       );

  //       // Start training in background with retry logic
  //       startBackgroundTrainingWithRetry(aiConfig);
  //     } else {
  //       debug.log(
  //         "ConversationDetails",
  //         "AUTO-TRAIN: Conversation already trained and up-to-date"
  //       );

  //       // Load summary for already trained conversation
  //       debug.log(
  //         "ConversationDetails",
  //         "AUTO-TRAIN: Loading summary for trained conversation..."
  //       );
  //       try {
  //         await loadSummaryInBackground();
  //         debug.log(
  //           "ConversationDetails",
  //           "AUTO-TRAIN: Summary loaded for trained conversation"
  //         );
  //       } catch (summaryError) {
  //         debug.warn(
  //           "ConversationDetails",
  //           "Failed to load summary for trained conversation:",
  //           summaryError
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     debug.warn("ConversationDetails", "Auto-training check failed:", error);
  //     // Retry auto-training after a delay if it failed
  //     setTimeout(() => {
  //       debug.log(
  //         "ConversationDetails",
  //         "AUTO-TRAIN: Retrying after failure..."
  //       );
  //       handleAutoTraining(messageCount);
  //     }, 10000); // Retry after 10 seconds
  //   }
  // }

  // Enhanced background training function with deduplication
  // async function startBackgroundTrainingWithRetry(
  //   aiConfig: any,
  //   retryCount: number = 0
  // ) {
  //   const maxRetries = 3;

  //   // 🆕 Prevent multiple simultaneous training calls
  //   if (isTrainingInProgress) {
  //     debug.log(
  //       "ConversationDetails",
  //       "🔄 AUTO-TRAIN: Training already in progress, skipping..."
  //     );
  //     return;
  //   }

  //   // 🆕 Check if we recently attempted training (within 30 seconds)
  //   const now = Date.now();
  //   if (now - lastTrainingAttempt < 30000) {
  //     debug.log(
  //       "ConversationDetails",
  //       "🔄 AUTO-TRAIN: Training attempted recently, skipping..."
  //     );
  //     return;
  //   }

  //   setIsTrainingInProgress(true);
  //   setLastTrainingAttempt(now);

  //   try {
  //     // First, fetch messages for training
  //     debug.log(
  //       "ConversationDetails",
  //       `📥 AUTO-TRAIN: Fetching messages for training (attempt ${
  //         retryCount + 1
  //       }/${maxRetries + 1})...`
  //     );

  //     const messagesResponse = await fetchWithDebug(
  //       `/api/leadconnector/conversations/${conversationId}/messages?limit=100`,
  //       { method: "GET" }
  //     );

  //     if (!messagesResponse?.messages?.messages?.length) {
  //       throw new Error("No messages found for training");
  //     }

  //     const messages = messagesResponse.messages.messages;
  //     debug.log(
  //       "ConversationDetails",
  //       `🔄 AUTO-TRAIN: Training with ${messages.length} messages`
  //     );

  //     const trainData = await fetchWithDebug(`/api/ai/conversation/train`, {
  //       method: "POST",
  //       body: JSON.stringify({
  //         conversationId,
  //         locationId,
  //         messages,
  //         temperature: aiConfig.temperature,
  //         model: aiConfig.model,
  //         humanlikeBehavior: aiConfig.humanlikeBehavior,
  //         silent: true, // Background training flag
  //       }),
  //     });

  //     if (trainData?.success) {
  //       debug.log(
  //         "ConversationDetails",
  //         "✅ AUTO-TRAIN: Background training completed successfully"
  //       );

  //       const newTrainingStatus = {
  //         isTrained: true,
  //         isTraining: false,
  //         lastUpdated: new Date().toISOString(),
  //         messageCount: trainData.trained_message_count || messages.length,
  //         vectorCount: trainData.vector_count || 0,
  //       };

  //       setTrainingStatus(newTrainingStatus);

  //       // 🔄 SYNC: Update conversation metadata with training status
  //       await syncTrainingStatusWithMetadata(
  //         newTrainingStatus,
  //         messages[0]?.id
  //       );

  //       // 🆕 Load summary after successful training
  //       debug.log(
  //         "ConversationDetails",
  //         "📄 AUTO-TRAIN: Loading summary after training..."
  //       );
  //       try {
  //         await loadSummaryInBackground();
  //         debug.log(
  //           "ConversationDetails",
  //           "✅ AUTO-TRAIN: Summary loaded after training"
  //         );
  //       } catch (summaryError) {
  //         debug.warn(
  //           "ConversationDetails",
  //           "Failed to load summary after training:",
  //           summaryError
  //         );
  //       }

  //       // Success! Reset retry count
  //       retryCountRef.current = 0;
  //     } else {
  //       throw new Error(trainData?.error || "Training failed");
  //     }
  //   } catch (error) {
  //     debug.error(
  //       "ConversationDetails",
  //       `Background training error (attempt ${retryCount + 1}):`,
  //       error
  //     );

  //     // Retry logic
  //     if (retryCount < maxRetries) {
  //       const retryDelay = (retryCount + 1) * 5000; // 5s, 10s, 15s delays
  //       debug.log(
  //         "ConversationDetails",
  //         `🔄 AUTO-TRAIN: Retrying in ${retryDelay / 1000} seconds...`
  //       );

  //       // 🆕 Clear any existing timeout
  //       if (trainingTimeoutRef.current) {
  //         clearTimeout(trainingTimeoutRef.current);
  //       }

  //       trainingTimeoutRef.current = setTimeout(() => {
  //         startBackgroundTrainingWithRetry(aiConfig, retryCount + 1);
  //       }, retryDelay);
  //     } else {
  //       // All retries failed
  //       debug.error(
  //         "ConversationDetails",
  //         "💥 AUTO-TRAIN: All retry attempts failed"
  //       );
  //       setTrainingStatus((prev) =>
  //         prev
  //           ? { ...prev, isTraining: false }
  //           : {
  //               isTrained: false,
  //               isTraining: false,
  //               lastUpdated: new Date().toISOString(),
  //               messageCount: 0,
  //               vectorCount: 0,
  //             }
  //       );

  //       // Show a non-intrusive notification
  //       console.warn(
  //         "🤖 Auto-training failed after multiple attempts. Please check your connection and try again later."
  //       );
  //     }
  //   } finally {
  //     setIsTrainingInProgress(false);
  //   }
  // }

  // 🔄 SYNC: Training status with conversation metadata
  // async function syncTrainingStatusWithMetadata(
  //   trainingStatus: any,
  //   lastMessageId?: string
  // ) {
  //   try {
  //     debug.log(
  //       "ConversationDetails",
  //       "🔄 SYNC: Updating conversation metadata with training status..."
  //     );

  //     const metadataUpdate = {
  //       trainingStatus,
  //       lastTrainingUpdate: new Date().toISOString(),
  //       lastMessageId: lastMessageId || null,
  //     };

  //     await fetchWithDebug(`/api/conversation-meta`, {
  //       method: "POST",
  //       body: JSON.stringify({
  //         conv_id: conversationId,
  //         location_id: locationId,
  //         data_type: 21, // AI_SETTINGS
  //         data: metadataUpdate,
  //         lastMessageId: lastMessageId,
  //       }),
  //     });

  //     debug.log(
  //       "ConversationDetails",
  //       "✅ SYNC: Training status synced with metadata"
  //     );
  //   } catch (error) {
  //     debug.warn(
  //       "ConversationDetails",
  //       "Failed to sync training status with metadata:",
  //       error
  //     );
  //   }
  // }

  // Background summary loading
  async function loadSummaryInBackground() {
    try {
      debug.log("ConversationDetails", "📄 BACKGROUND: Loading summary...");

      // Get AI configuration for summary feature
      const aiConfig = getFeatureAIConfig("summary");

      const summaryData = await fetchWithDebug(`/api/ai/conversation/summary`, {
        method: "POST",
        body: JSON.stringify({
          userId: "client-user",
          conversationId,
          locationId, // Add locationId for better context
          model: aiConfig.model,
          temperature: aiConfig.temperature,
          humanlikeBehavior: aiConfig.humanlikeBehavior,
        }),
      });

      if (summaryData?.success && summaryData?.summary) {
        setSummary(summaryData.summary);
        debug.log("ConversationDetails", "✅ BACKGROUND: Summary loaded", {
          summaryLength: summaryData.summary.length,
          model: aiConfig.model,
        });
      } else {
        setSummary(null);
        debug.warn(
          "ConversationDetails",
          "⚠️ BACKGROUND: No summary returned",
          summaryData
        );
      }
    } catch (error) {
      debug.error("ConversationDetails", "Failed to load summary:", error);
      setSummary(null);
    }
  }

  // Background autopilot status loading
  // async function loadAutopilotStatusInBackground() {
  //   try {
  //     debug.log(
  //       "ConversationDetails",
  //       "🤖 BACKGROUND: Loading autopilot status..."
  //     );

  //     const response = await fetch(
  //       `/api/autopilot/config?conversationId=${conversationId}`
  //     );
  //     if (response.ok) {
  //       const data = await response.json();
  //       debug.log(
  //         "ConversationDetails",
  //         "✅ BACKGROUND: Autopilot status loaded"
  //       );
  //     }
  //   } catch (error) {
  //     debug.warn(
  //       "ConversationDetails",
  //       "Background autopilot load failed:",
  //       error
  //     );
  //   }
  // }

  // Background active agent loading
  // async function loadActiveAgentInBackground() {
  //   try {
  //     debug.log(
  //       "ConversationDetails",
  //       "🎯 BACKGROUND: Loading active agent..."
  //     );

  //     // Get user from a simulated API call (you may need to adjust this)
  //     const currentUser = { id: "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21" }; // Temp user ID

  //     // Load global settings
  //     const globalResponse = await fetch("/api/ai/settings/global");
  //     const globalSettings = globalResponse.ok
  //       ? (await globalResponse.json()).data
  //       : null;

  //     // Load conversation settings
  //     const convResponse = await fetch(
  //       `/api/conversation-meta?conversationId=${conversationId}`
  //     );
  //     const convData = convResponse.ok ? await convResponse.json() : null;
  //     const conversationSettings = convData?.success
  //       ? convData.data?.data
  //       : null;

  //     // Load available agents
  //     const agentsResponse = await fetch("/api/ai/agents");
  //     const agentsData = agentsResponse.ok ? await agentsResponse.json() : null;
  //     const availableAgents = agentsData?.success
  //       ? agentsData.data?.map((a: any) => a.id)
  //       : [];

  //     // Select agent using our utility (default to query feature)
  //     const selectedAgentId = selectAgentForFeature(
  //       "query",
  //       globalSettings,
  //       conversationSettings,
  //       availableAgents
  //     );

  //     if (selectedAgentId && agentsData?.success) {
  //       const agentDetails = agentsData.data.find(
  //         (a: any) => a.id === selectedAgentId
  //       );
  //       if (agentDetails) {
  //         setActiveAgent({
  //           id: selectedAgentId,
  //           name: agentDetails.name,
  //         });
  //         debug.log(
  //           "ConversationDetails",
  //           `✅ BACKGROUND: Active agent loaded: ${agentDetails.name}`
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     debug.warn(
  //       "ConversationDetails",
  //       "Background active agent load failed:",
  //       error
  //     );
  //   }
  // }

  // 🤖 VOX-AI: Check if conversation has vox-ai tag and auto-enable autopilot
  // async function checkVoxAiAndAutoEnableAutopilot() {
  //   try {
  //     debug.log(
  //       "ConversationDetails",
  //       "🤖 BACKGROUND: Checking for vox-ai tag..."
  //     );

  //     // We need to get conversation details including tags
  //     // This might require calling the conversations search API or a conversation details endpoint
  //     const response = await fetch(
  //       `/api/leadconnector/conversations/search?conversationId=${conversationId}&limit=1`
  //     );
  //     if (!response.ok) {
  //       debug.warn(
  //         "ConversationDetails",
  //         "Could not fetch conversation details for vox-ai check"
  //       );
  //       return;
  //     }

  //     const data = await response.json();
  //     const conversation = data.data?.conversations?.[0];

  //     if (conversation && locationId) {
  //       await autoEnableForSingleConversation(conversation, locationId);
  //       debug.log(
  //         "ConversationDetails",
  //         "✅ BACKGROUND: Vox-AI check completed"
  //       );
  //     }
  //   } catch (error) {
  //     debug.warn(
  //       "ConversationDetails",
  //       "Background vox-ai check failed (non-critical):",
  //       error
  //     );
  //   }
  // }

  // Load more messages function
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore || !oldestMessageId) {
      debug.log("ConversationDetails", "Cannot load more messages", {
        hasMoreMessages,
        isLoadingMore,
        oldestMessageId,
      });
      return;
    }

    try {
      setIsLoadingMore(true);

      const url = `/api/leadconnector/conversations/${conversationId}/messages?limit=100&lastMessageId=${oldestMessageId}`;
      debug.log("ConversationDetails", "Loading more messages:", url);

      const messagesData = await fetchWithDebug(url);
      const newMessages = extractMessagesFromResponse(messagesData);

      debug.log(
        "ConversationDetails",
        `Load more: Extracted ${newMessages.length} additional messages`
      );

      if (newMessages.length > 0) {
        // Prepend older messages to the beginning of the array (they're older)
        setMessages((prev) => [...newMessages, ...prev]);

        // Update pagination state
        const newOldestMessage = newMessages[newMessages.length - 1];
        setOldestMessageId(newOldestMessage?.id);

        // If we got fewer than 100 messages, there are no more to load
        setHasMoreMessages(newMessages.length === 100);

        toast.success(`Loaded ${newMessages.length} more messages`);
      } else {
        setHasMoreMessages(false);
        toast.info("No more messages to load");
      }
    } catch (error) {
      debug.error(
        "ConversationDetails",
        "Failed to load more messages:",
        error
      );
      toast.error("Failed to load more messages. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle manual summary regeneration
  async function handleRegenerateSummary() {
    debug.log("ConversationDetails", "Regenerating summary", {
      conversationId,
      locationId,
    });

    try {
      setIsRegeneratingSummary(true);
      setError(null);

      // Check if conversation is trained first
      if (!trainingStatus?.isTrained) {
        toast.error(
          "Please train the conversation first before generating a summary"
        );
        return;
      }

      // Get AI configuration for summary feature
      const aiConfig = getFeatureAIConfig("summary");

      // Call FastAPI directly to generate a fresh summary with AI configuration
      const summaryData = await fetchWithDebug(`/api/ai/conversation/summary`, {
        method: "POST",
        body: JSON.stringify({
          userId: "client-user",
          conversationId,
          locationId,
          regenerate: true, // Add flag to force regeneration
          temperature: aiConfig.temperature,
          model: aiConfig.model,
          humanlikeBehavior: aiConfig.humanlikeBehavior,
        }),
      });

      if (summaryData?.success && summaryData?.summary) {
        setSummary(summaryData.summary);
        const modelInfo = ` [${aiConfig.model}@${aiConfig.temperature}]`;
        toast.success(`Summary regenerated successfully${modelInfo}`);
        debug.log(
          "ConversationDetails",
          "Summary regenerated:",
          summaryData.summary.substring(0, 100) + "..."
        );
      } else {
        throw new Error(summaryData?.error || "Failed to regenerate summary");
      }
    } catch (err) {
      debug.error("ConversationDetails", "Summary regeneration error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to regenerate summary";
      setError(errorMessage);
      toast.error(`Summary regeneration failed: ${errorMessage}`);
    } finally {
      setIsRegeneratingSummary(false);
    }
  }

  // Simple manual training function
  const handleManualTrain = async () => {
    try {
      // console.log("MANUAL TRAIN: Button clicked!", {
      //   conversationId,
      //   locationId,
      // });
      debug.log("ConversationDetails", "Manual training triggered");

      // Show loading state
      setTrainingStatus((prev) =>
        prev
          ? {
              ...prev,
              isTraining: true,
            }
          : {
              isTrained: false,
              isTraining: true,
              lastUpdated: new Date().toISOString(),
              messageCount: messages.length,
              vectorCount: 0,
            }
      );

      // console.log("MANUAL TRAIN: Loading state set, fetching messages...");

      // Get AI configuration
      const aiConfig = getFeatureAIConfig("training");
      // console.log("MANUAL TRAIN: AI config:", aiConfig);

      // Try to fetch messages for training
      let trainingMessages = [];
      try {
        // console.log(
        //   "MANUAL TRAIN: Fetching messages from:",
        //   `/api/leadconnector/conversations/${conversationId}/messages?limit=100`
        // );

        const messagesResponse = await fetchWithDebug(
          `/api/leadconnector/conversations/${conversationId}/messages?limit=100`,
          { method: "GET" }
        );

        // console.log("MANUAL TRAIN: Raw messages response:", messagesResponse);

        // console.log("MANUAL TRAIN: Messages response:", {
        //   hasResponse: !!messagesResponse,
        //   hasMessages: !!messagesResponse?.messages?.messages,
        //   messageCount: messagesResponse?.messages?.messages?.length || 0,
        //   responseKeys: messagesResponse ? Object.keys(messagesResponse) : [],
        //   messagesKeys: messagesResponse?.messages
        //     ? Object.keys(messagesResponse.messages)
        //     : [],
        // });

        // Handle different response structures
        if (messagesResponse?.messages?.messages?.length) {
          trainingMessages = messagesResponse.messages.messages;
          // console.log("MANUAL TRAIN: Using messages.messages structure");
        } else if (messagesResponse?.messages?.length) {
          trainingMessages = messagesResponse.messages;
          // console.log("MANUAL TRAIN: Using messages structure");
        } else if (Array.isArray(messagesResponse)) {
          trainingMessages = messagesResponse;
          // console.log("MANUAL TRAIN: Using direct array structure");
        } else {
          // console.log("MANUAL TRAIN: No valid message structure found");
          // debug.log(
          //   "ConversationDetails",
          //   "No messages found, will train with conversation metadata only"
          // );
        }

        // console.log("MANUAL TRAIN: Final training messages:", {
        //   count: trainingMessages.length,
        //   firstMessage: trainingMessages[0],
        //   lastMessage: trainingMessages[trainingMessages.length - 1],
        // });

        // Transform messages to ensure they have the required fields for FastAPI
        if (trainingMessages.length > 0) {
          trainingMessages = trainingMessages
            .map((msg: any, index: number) => {
              // Ensure message has required fields for FastAPI
              const transformedMessage = {
                id: msg.id || `msg_${index}`,
                body: msg.body || "",
                direction: msg.direction || "inbound",
                dateAdded: msg.dateAdded || new Date().toISOString(),
                messageType: msg.messageType || "TYPE_SMS",
                contentType: msg.contentType || "text/plain",
                status: msg.status || "delivered",
                type: msg.type || 2,
                role: msg.direction === "outbound" ? "assistant" : "user",
                conversationId: msg.conversationId || conversationId,
                locationId: msg.locationId || locationId,
                contactId: msg.contactId || "",
                userId: msg.userId,
                source: msg.source || "app",
                contactName: msg.contactName,
                fullName: msg.fullName,
                email: msg.email,
                phone: msg.phone,
              };

              // Only include messages with actual body content
              if (transformedMessage.body && transformedMessage.body.trim()) {
                return transformedMessage;
              }
              // Also include messages with other content types (like HTML emails)
              if (msg.body || msg.content || msg.text || msg.message) {
                const alternativeBody =
                  msg.body || msg.content || msg.text || msg.message || "";
                if (alternativeBody.trim()) {
                  return {
                    ...transformedMessage,
                    body: alternativeBody,
                  };
                }
              }
              return null;
            })
            .filter(Boolean); // Remove null messages

          // console.log("MANUAL TRAIN: Transformed messages:", {
          //   originalCount: trainingMessages.length,
          //   validCount: trainingMessages.length,
          //   sampleMessage: trainingMessages[0],
          // });
        }

        // If no valid messages found, create synthetic messages with customer details
        if (trainingMessages.length === 0) {
          // console.log(
          //   "MANUAL TRAIN: No valid messages found, creating synthetic messages with customer details"
          // );

          const customerName = urlContactInfo?.name || "Customer";
          const customerEmail = urlContactInfo?.email || "";
          const customerPhone = urlContactInfo?.phone || "";

          // Create synthetic messages with customer information
          trainingMessages = [
            {
              id: "synthetic_1",
              body: `Contact Information:\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\n\nThis is a conversation with ${customerName}.`,
              direction: "inbound",
              dateAdded: new Date().toISOString(),
              messageType: "TYPE_SMS",
              contentType: "text/plain",
              status: "delivered",
              type: 2,
              role: "user",
              conversationId: conversationId,
              locationId: locationId,
              contactId: "",
              userId: "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21",
              source: "app",
              contactName: customerName,
              fullName: customerName,
              email: customerEmail,
              phone: customerPhone,
            },
            {
              id: "synthetic_2",
              body: `Customer ${customerName} has initiated a conversation. Contact details: ${customerEmail} ${customerPhone}`,
              direction: "outbound",
              dateAdded: new Date().toISOString(),
              messageType: "TYPE_SMS",
              contentType: "text/plain",
              status: "delivered",
              type: 2,
              role: "assistant",
              conversationId: conversationId,
              locationId: locationId,
              contactId: "",
              userId: "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21",
              source: "app",
              contactName: customerName,
              fullName: customerName,
              email: customerEmail,
              phone: customerPhone,
            },
          ];

          // console.log("MANUAL TRAIN: Created synthetic messages:", {
          //   count: trainingMessages.length,
          //   customerName,
          //   customerEmail,
          //   customerPhone,
          // });
        }
      } catch (error) {
        console.error("MANUAL TRAIN: Error fetching messages:", error);
        debug.warn(
          "ConversationDetails",
          "Failed to fetch messages, will train with metadata only:",
          error
        );
      }

      // Create training payload with whatever data we have
      const trainingPayload = {
        userId: "ca2f09c8-1dca-4281-9b9b-0f3ffefd9b21", // Default user ID
        conversationId,
        locationId,
        messages: trainingMessages,
        messageCount: trainingMessages.length,
        knowledgebaseId: conversationId, // Use conversation ID as knowledge base ID
        generateSummary: true,
        // Add contact information if available
        contactInfo: {
          name: urlContactInfo?.name,
          email: urlContactInfo?.email,
          phone: urlContactInfo?.phone,
          contactId: trainingMessages[0]?.contactId,
        },
        // Add conversation metadata
        conversationMetadata: {
          conversationId,
          locationId,
          messageCount: trainingMessages.length,
          conversationType: trainingMessages[0]?.messageType || "TYPE_SMS",
          hasMessages: trainingMessages.length > 0,
        },
        // Add metadata for FastAPI
        metadata: {
          conversationId,
          locationId,
          contactInfo: {
            name: urlContactInfo?.name,
            email: urlContactInfo?.email,
            phone: urlContactInfo?.phone,
            contactId: trainingMessages[0]?.contactId,
          },
          conversationType: trainingMessages[0]?.messageType || "TYPE_SMS",
          hasMessages: trainingMessages.length > 0,
        },
      };

      // console.log("MANUAL TRAIN: Training payload:", {
      //   messageCount: trainingMessages.length,
      //   hasContactInfo: !!trainingPayload.contactInfo.name,
      //   conversationId,
      //   locationId,
      //   payload: trainingPayload,
      // });

      // console.log("MANUAL TRAIN: Calling training endpoint...");

      const trainData = await fetchWithDebug(`/api/ai/conversation/train`, {
        method: "POST",
        body: JSON.stringify(trainingPayload),
      });

      // console.log("MANUAL TRAIN: Training response:", trainData);

      if (trainData?.success) {
        debug.log(
          "ConversationDetails",
          "Manual training completed successfully"
        );
        // console.log("MANUAL TRAIN: Training successful!");

        const newTrainingStatus = {
          isTrained: true,
          isTraining: false,
          lastUpdated: new Date().toISOString(),
          messageCount:
            trainData.trained_message_count || trainingMessages.length,
          vectorCount: trainData.vector_count || 0,
        };

        setTrainingStatus(newTrainingStatus);
        toast.success("Conversation trained successfully!");

        // Load summary after successful training
        try {
          await loadSummaryInBackground();
        } catch (summaryError) {
          debug.warn(
            "ConversationDetails",
            "Failed to load summary after manual training:",
            summaryError
          );
        }
      } else {
        throw new Error(trainData?.error || "Training failed");
      }
    } catch (error) {
      console.error("MANUAL TRAIN: Training failed:", error);
      debug.error("ConversationDetails", "Manual training failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Training failed";
      setError(errorMessage);
      toast.error(`Training failed: ${errorMessage}`);

      setTrainingStatus((prev) =>
        prev
          ? { ...prev, isTraining: false }
          : {
              isTrained: false,
              isTraining: false,
              lastUpdated: new Date().toISOString(),
              messageCount: 0,
              vectorCount: 0,
            }
      );
    }
  };

  // Load conversation settings (moved from old useEffect)
  useEffect(() => {
    loadConversationSettings();
  }, [conversationId]);

  // Load initial data - FAST LOADING: Messages first, AI features in background
  useEffect(() => {
    async function loadConversationMessages() {
      try {
        setIsLoading(true);
        setError(null);

        // PRIORITY 1: Load messages IMMEDIATELY for fast UX
        const url = `/api/leadconnector/conversations/${conversationId}/messages?limit=100`;

        const messagesData = await fetchWithDebug(url);
        const pageMessages = extractMessagesFromResponse(messagesData);

        setMessages(pageMessages);

        // Set pagination state
        if (pageMessages.length > 0) {
          const oldestMessage = pageMessages[pageMessages.length - 1];
          setOldestMessageId(oldestMessage?.id);
          setHasMoreMessages(pageMessages.length === 100);
        } else {
          setHasMoreMessages(false);
        }

        // Show messages immediately - user can start reading
        setIsLoading(false);

        // BACKGROUND: Start AI features loading without blocking UI
        // loadAIFeaturesInBackground(pageMessages.length);
      } catch (messagesError) {
        setError("Failed to load conversation messages");
        setIsLoading(false);
      }
    }

    // Background AI features loading
    // async function loadAIFeaturesInBackground(messageCount: number) {
    //   debug.log("ConversationDetails", "BACKGROUND: Starting AI features load");

    //   // 🆕 Check FastAPI health FIRST - this is critical for AI functionality
    //   // await checkFastAPIHealth();

    //   // Load conversation settings first (for agent info)
    //   loadConversationSettings();

    //   // Auto-training logic: Check if conversation needs training
    //   // await handleAutoTraining(messageCount);

    //   // Load other AI features in parallel (non-blocking)
    //   // Note: Summary loading is now handled after training completes
    //   Promise.allSettled([
    //     loadAutopilotStatusInBackground(),
    //     loadActiveAgentInBackground(),
    //     checkVoxAiAndAutoEnableAutopilot(), // Critical vox-ai feature
    //     // Only load summary if not currently training (to avoid race condition)
    //     ...(trainingStatus?.isTraining ? [] : [loadSummaryInBackground()]),
    //   ]).then((results) => {
    //     debug.log("ConversationDetails", "BACKGROUND: AI features loaded", {
    //       autopilot: results[0].status,
    //       activeAgent: results[1].status,
    //       voxAiCheck: results[2].status,
    //       summary: results[3]?.status || "skipped (training in progress)",
    //       fastApiStatus: fastApiStatus.isOnline ? "online" : "offline",
    //     });
    //   });
    // }

    // Start the loading process
    loadConversationMessages();
  }, [conversationId, locationId]);

  // Auto-refresh training status when training is in progress
  useEffect(() => {
    if (!trainingStatus?.isTraining) return;

    const intervalId = setInterval(async () => {
      debug.log("ConversationDetails", "Auto-refreshing training status...");
      try {
        const aiConfig = getFeatureAIConfig("training");
        const statusData = await fetchWithDebug(
          `/api/ai/conversation/training-status`,
          {
            method: "POST",
            body: JSON.stringify({
              conversationId,
              locationId,
              temperature: aiConfig.temperature,
              model: aiConfig.model,
              humanlikeBehavior: aiConfig.humanlikeBehavior,
            }),
          }
        );

        if (statusData) {
          setTrainingStatus({
            isTrained: statusData.is_trained || false,
            isTraining: statusData.is_training || false,
            lastUpdated: statusData.last_updated || new Date().toISOString(),
            messageCount: statusData.message_count || 0,
            vectorCount: statusData.vector_count || 0,
          });

          // Stop polling if training is complete
          if (statusData.is_trained && !statusData.is_training) {
            debug.log(
              "ConversationDetails",
              "Training completed - stopping auto-refresh"
            );
          }
        }
      } catch (error) {
        debug.error(
          "ConversationDetails",
          "Failed to refresh training status:",
          error
        );
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [trainingStatus?.isTraining, conversationId, locationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated before scroll
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        } else {
          console.warn("⚠️ messagesEndRef not found, cannot scroll");
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        // console.log("♻️ Cleared scroll timeout");
      };
    }
  }, [messages]);

  const processedMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || messages?.length === 0) return;

    const handleNewMessage = (response: any) => {
      if (!response) return;

      console.log("response: ", response);
      const contactMatch =
        messages?.[0]?.contactId === response?.contactId ||
        messages?.[0]?.contactId === response?.message?.contactId;

      if (!contactMatch) {
        console.log("🚫 Ignored: contact id mismatch");
        return;
      }

      console.log("last message: ", messages[messages.length - 1]);

      // --- Case 1: Inbound from user (no nested message object) ---
      if (response?.message && response.type === 19) {
        const inboundMsg = {
          id: Date.now().toString(),
          body: response.message,
          type: "text",
          direction: "inbound",
          status: "delivered",
          conversationId: response.conversationId || "temp",
          contactId: response.contactId,
          dateAdded: new Date().toISOString(),
          source: "user",
          messageType: messages[messages.length - 1].messageType,
          contentType: "text/plain",
          phone: response.phone,
        };
        setMessages((prev) => [...prev, inboundMsg]);
        return;
      }

      // --- Case 2: Outbound from AI (type = "WhatsApp") ---
      if (response?.type === "WhatsApp") {
        const aiMessage = {
          id: Date.now().toString(),
          body: response.message,
          type: "text",
          direction: "outbound",
          status: "sent",
          conversationId: response.conversationId || "temp",
          contactId: response.contactId,
          dateAdded: new Date().toISOString(),
          source: "ai",
          messageType: messages[messages.length - 1].messageType,
          contentType: "text/plain",
          phone: response.phone,
        };
        setMessages((prev) => [...prev, aiMessage]);
        return;
      }

      // --- Case 3: Outbound from backend (contains message object) ---
      if (response?.message && typeof response.message === "object") {
        const msg = response.message;
        const outboundMsg = {
          id: msg.id,
          body: msg.body || "",
          type: msg.type || "text",
          direction: "outbound",
          status: msg.status || "sent",
          conversationId: msg.conversationId || "temp",
          contactId: msg.contactId,
          dateAdded: msg.dateAdded || new Date().toISOString(),
          source: msg.source || "app",
          messageType: messages[messages.length - 1].messageType,
          contentType: msg.contentType || "text/plain",
          attachments: msg.attachments || [],
          locationId: msg.locationId || "",
          phone: response.phone,
        };
        setMessages((prev) => [...prev, outboundMsg]);
        return;
      }

      console.log("⚠️ Unknown message format:", response);
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      processedMessagesRef.current.clear();
    };
  }, [socket, messages]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="flex flex-col h-full items-center justify-center p-8">
        <LoadingSpinner className="w-8 h-8" />
        <div className="mt-4 text-muted-foreground">
          Loading conversation
          {retryCountRef.current > 0 ? ` (retry ${retryCountRef.current})` : ""}
          ...
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-red-500 font-medium">
            Failed to load conversation
          </div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // Main render - Responsive layout with proper height management
  return (
    <Card className="flex flex-col h-[calc(110vh)] max-h-[calc(110vh)] overflow-hidden">
      {/* Header Section */}
      <ConversationHeader contact={urlContactInfo}>
        <div className="flex items-center gap-1">
          {/* Autopilot Floating Button */}
          <AutopilotFloatingButton conversationId={conversationId} />

          {/* Manual Train Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={trainingStatus?.isTrained ? "outline" : "default"}
                onClick={() => {
                  handleManualTrain();
                }}
                // disabled={trainingStatus?.isTraining || !fastApiStatus.isOnline}
                className={cn(
                  "h-8 px-3",
                  trainingStatus?.isTrained &&
                    "border-green-500 text-green-700 hover:bg-green-50"
                )}
              >
                {trainingStatus?.isTraining ? (
                  <>
                    <LoadingSpinner className="w-3 h-3 mr-1" />
                    Training...
                  </>
                ) : (
                  <>
                    <Train className="w-3 h-3 mr-1" />
                    Train
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p>
                  <strong>Train Conversation</strong>
                </p>
                <p>Enable AI features for this conversation</p>
                <p className="text-muted-foreground mt-1">
                  {trainingStatus?.isTrained ? "Trained" : "Not trained"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Active AI Agent Indicator */}
          {/* {activeAgent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 h-6 border-purple-200 text-purple-700 bg-purple-50"
                >
                  <Bot className="w-3 h-3 mr-1" />
                  {activeAgent.name.length > 12
                    ? activeAgent.name.slice(0, 12) + "..."
                    : activeAgent.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p>
                    <strong>Active AI Agent</strong>
                  </p>
                  <p>{activeAgent.name}</p>
                  <p className="text-muted-foreground mt-1">
                    This agent handles AI features for this conversation
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )} */}

          {/* AI Training Status Dot */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                {/* Status dots removed for simplicity */}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-2">
                {/* Training Status */}
                <div>
                  <p>
                    <strong>Training Status</strong>
                  </p>
                  {trainingStatus?.isTraining ? (
                    <p>Training in progress...</p>
                  ) : trainingStatus?.isTrained ? (
                    <p>Conversation trained</p>
                  ) : (
                    <p>Conversation not trained</p>
                  )}
                  {trainingStatus?.lastUpdated && (
                    <p className="text-muted-foreground">
                      Last updated:{" "}
                      {new Date(trainingStatus.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </ConversationHeader>

      {/* Summary Section */}
      {summary && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Summary:
              </span>
              {trainingStatus?.isTrained && (
                <CheckCircle className="w-3 h-3 text-green-500" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerateSummary}
              disabled={isRegeneratingSummary}
              className="h-6 px-2 text-xs"
            >
              {isRegeneratingSummary ? (
                <>
                  <LoadingSpinner className="w-3 h-3 mr-1" />
                  Regenerating...
                </>
              ) : (
                "Regenerate"
              )}
            </Button>
          </div>
          <div className="mt-1 text-sm text-foreground">{summary}</div>
        </div>
      )}

      {/* Main Messages Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center py-2 border-b border-border/30 bg-background">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="h-8 px-4"
            >
              {isLoadingMore ? (
                <>
                  <LoadingSpinner className="w-3 h-3 mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronUp className="w-3 h-3 mr-2" />
                  Load More Messages
                </>
              )}
            </Button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages found</p>
                  </div>
                </div>
              ) : (
                messages?.map((msg, index) => (
                  <MessageBubble
                    key={msg.id || index}
                    message={msg}
                    isLast={index === messages.length - 1}
                    urlContactInfo={urlContactInfo}
                  />
                ))
              )}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Query Input Panel - Overlay style when active */}
      {showQueryInput && (
        <div className="border-t border-border/30 bg-muted/30">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ask AI</span>
              {conversationSettings?.agents?.query && (
                <span className="text-xs text-muted-foreground">
                  • Agent Active
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQueryInput(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <QueryInput
              conversationId={conversationId}
              locationId={locationId}
              disabled={disabled}
              conversationSettings={conversationSettings}
            />
          </div>
        </div>
      )}

      {/* Message Input - Fixed bottom with responsive sizing */}
      <div className="border-t border-border/30 bg-background flex-shrink-0">
        <MessageInput
          // newMessage={newMessage}
          conversationId={conversationId}
          recentMessages={messages}
          onToggleQuery={setShowQueryInput}
          locationId={locationId}
          disabled={disabled}
          showQueryInput={showQueryInput}
          isConversationTrained={trainingStatus?.isTrained || false} // Keep for display info only
          contactInfo={{
            name: urlContactInfo?.name,
            email: urlContactInfo?.email,
            phone: urlContactInfo?.phone,
          }}
          conversationType={
            messages.length > 0
              ? messages.find((msg) => msg.messageType)?.messageType
              : undefined
          }
          messagesList={messages as any}
          // messagesList={messagesList as any}
          isTrainingInProgresss={isTrainingInProgress}
          // selectedMessageType={selectedMessageType}
          // setSelectedMessageType={setSelectedMessageType}
          // getAvailableMessageTypes={getAvailableMessageTypes}
        />
      </div>
    </Card>
  );
}
