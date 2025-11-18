export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  status?: MessageStatus;
  type: MessageType;
  locationId: string;
  body: string;
  contactId: string;
  conversationId: string;
  dateAdded: string;
  messageType: MessageType;
  contentType?: string;
  attachments?: Attachment[];
  userId?: string;
  source?: 'app' | 'workflow' | 'campaign';
  meta?: {
    callDuration?: number;
    [key: string]: any;
  };
  [key: string]: any; // Allow additional properties
}

export type MessageType = 
  | 'TYPE_SMS'
  | 'TYPE_EMAIL'
  | 'TYPE_WEBCHAT'
  | 'TYPE_ACTIVITY_CONTACT'
  | 'TYPE_VOICE'
  | 'TYPE_LOCATION'
  | 'TYPE_CUSTOM_EMAIL'
  | 'TYPE_CALL'
  | 'TYPE_VOICEMAIL'
  | 'TYPE_FACEBOOK'
  | 'TYPE_GMB'
  | 'TYPE_INSTAGRAM'
  | 'TYPE_WHATSAPP'
  | 'TYPE_SMS_REVIEW_REQUEST'
  | 'TYPE_SMS_NO_SHOW_REQUEST'
  | 'TYPE_CAMPAIGN_SMS'
  | 'TYPE_CAMPAIGN_CALL'
  | 'TYPE_CAMPAIGN_EMAIL'
  | 'TYPE_CAMPAIGN_VOICEMAIL'
  | 'TYPE_CAMPAIGN_FACEBOOK'
  | 'TYPE_CAMPAIGN_MANUAL_CALL'
  | 'TYPE_CAMPAIGN_MANUAL_SMS'
  | 'TYPE_CAMPAIGN_GMB'
  | 'TYPE_REVIEW'
  | 'TYPE_CUSTOM_SMS'
  | 'TYPE_CUSTOM_EMAIL'
  | 'TYPE_CUSTOM_PROVIDER_SMS'
  | 'TYPE_CUSTOM_PROVIDER_EMAIL'
  | 'TYPE_IVR_CALL'
  | 'TYPE_ACTIVITY_INVOICE'
  | 'TYPE_ACTIVITY_PAYMENT'
  | 'TYPE_ACTIVITY_OPPORTUNITY'
  | 'TYPE_LIVE_CHAT'
  | 'TYPE_LIVE_CHAT_INFO_MESSAGE'
  | 'TYPE_ACTIVITY_APPOINTMENT'
  | 'TYPE_FACEBOOK_COMMENT'
  | 'TYPE_INSTAGRAM_COMMENT'
  | 'TYPE_CUSTOM_CALL'
  | 'TYPE_INTERNAL_COMMENT';

export type MessageStatus = 
  | 'delivered'
  | 'undelivered'
  | 'read'
  | 'failed'
  | 'pending'
  | 'sent';

export interface MessagesResponse {
  messages: {
    lastMessageId?: string;
    nextPage: boolean;
    messages: Message[];
  };
  traceId: string;
}

export interface Attachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface MessageComponentProps {
  message: Message;
  contactName?: string;
}
