"use client";

import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
} from "react";

interface IConversationProvider {
  children?: ReactNode;
}

interface IConversationContext {
  conversationsUnreadCount: number;
  setConversationsUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const ConversationContext = createContext<IConversationContext | null>(null);

export const ConversationProvider: FC<IConversationProvider> = ({
  children,
}) => {
  const [conversationsUnreadCount, setConversationsUnreadCount] =
    useState<number>(0);

  return (
    <ConversationContext.Provider
      value={{ conversationsUnreadCount, setConversationsUnreadCount }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

// Custom hook for easier usage
export const useConversations = () => {
  const ctx = useContext(ConversationContext);
  if (!ctx)
    throw new Error(
      "useConversations must be used within ConversationProvider"
    );
  return ctx;
};
