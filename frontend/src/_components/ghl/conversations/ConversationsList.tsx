"use client";

import React, { useState } from "react";
import { Conversation } from "@/lib/leadconnector/types/conversationTypes";
import { LoadingIcon } from "@/_components/atoms/LoadingIcon";
import {
  formatMessageDate,
  formatMessageType,
  formatPhoneNumber,
} from "./utils/formatters";
import { MessageType } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConversationDetailsPopup } from "./ConversationDetailsPopup";

interface ConversationsListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onConversationClick: (conversation: Conversation) => void;
}

export function ConversationsList({
  conversations,
  isLoading,
  onConversationClick,
}: ConversationsListProps) {
  const [detailsConversation, setDetailsConversation] =
    useState<Conversation | null>(null);

  // Loading state
  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingIcon />
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0 && !isLoading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No conversations found
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border max-w-full overflow-hidden">
        {conversations?.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            onClick={() => onConversationClick(conversation)}
            onViewDetails={(conversation) =>
              setDetailsConversation(conversation)
            }
          />
        ))}
      </div>

      <ConversationDetailsPopup
        conversation={detailsConversation}
        isOpen={!!detailsConversation}
        onClose={() => setDetailsConversation(null)}
      />
    </>
  );
}

const ConversationItem = ({
  conversation,
  onClick,
  onViewDetails,
}: {
  conversation: Conversation;
  onClick: () => void;
  onViewDetails: (conversation: Conversation) => void;
}) => {
  const contactName =
    conversation.contactName ||
    conversation.email ||
    conversation.phone ||
    "Unknown Contact";

  return (
    <div
      className="px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors group relative"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar/Status */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
            <span className="text-sm font-semibold text-muted-foreground">
              {contactName.charAt(0).toUpperCase()}
            </span>

            {/* Status indicators */}
            <div className="absolute -bottom-0.5 -right-0.5 flex flex-col gap-0.5">
              {conversation.unreadCount > 0 && (
                <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">
                    {conversation.unreadCount > 9
                      ? "9+"
                      : conversation.unreadCount}
                  </span>
                </div>
              )}
              {conversation.tags?.includes("vox-ai") && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name and Time */}
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {contactName}
              </h3>
            </div>

            {/* Time */}
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatMessageDate(conversation.lastMessageDate)}
            </span>
          </div>

          {/* Email (if different from name) */}
          {conversation.email && conversation.email !== contactName && (
            <div className="text-xs text-muted-foreground mb-1 truncate">
              {conversation.email}
            </div>
          )}

          {/* Last message */}
          {conversation.lastMessageBody && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                {conversation.lastMessageBody}
              </p>

              {/* Message meta */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                {conversation.lastMessageDirection === "outbound" ? (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {conversation.lastOutboundMessageAction === "automated" && (
                  <span className="text-yellow-600 font-medium">🤖</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Tags and actions */}
        <div className="flex flex-col items-end gap-1 ml-2">
          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
              {conversation.tags.includes("vox-ai") ? (
                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-100 text-green-700 border-green-200 font-medium">
                  🤖 AI
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5"
                >
                  {conversation.tags[0]}
                </Badge>
              )}

              {conversation.tags.length > 1 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1 py-0 h-5"
                  title={`Tags: ${conversation.tags.join(", ")}`}
                >
                  +{conversation.tags.length - 1}
                </Badge>
              )}
            </div>
          )}

          {/* View details button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onViewDetails(conversation);
            }}
            title="View details"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};
