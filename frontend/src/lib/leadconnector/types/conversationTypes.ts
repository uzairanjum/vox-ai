export interface Conversation {
  id: string;
  locationId: string;
  dateAdded: number;
  dateUpdated: number;
  lastMessageDate: number;
  lastMessageType: string;
  lastMessageBody: string;
  lastOutboundMessageAction: 'manual' | 'automated';
  lastMessageDirection: 'inbound' | 'outbound';
  inbox: boolean;
  unreadCount: number;
  lastManualMessageDate: number;
  followers?: string[];
  mentions?: string[];
  lastInternalComment?: string;
  isLastMessageInternalComment: boolean;
  contactId: string;
  fullName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  tags: string[];
  status?: string;
  type: ConversationType;
  scoring?: Array<{
    id: string;
    score: number;
  }>;
  attributed: boolean;
  sort?: number[];
}

export type ConversationType = 
  | 'TYPE_EMAIL'
  | 'TYPE_SMS'
  | 'TYPE_PHONE'
  | 'TYPE_FACEBOOK'
  | 'TYPE_WHATSAPP'
  | 'TYPE_GMB'
  | 'TYPE_INSTAGRAM';

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    lastConversationId?: string;
    hasMore: boolean;
  };
}

export interface ConversationSearchParams {
  limit?: number;
  locationId?: string;
  lastConversationId?: string;
  query?: string;
  status?: string[];
  type?: ConversationType[];
}
