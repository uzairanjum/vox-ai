// Common response type for all GHL actions
export interface GhlActionResponse<T> {
  data?: T;
  error?: string;
}

// Location related types
export interface GhlLocation {
  id: string;
  name: string;
  timeZone: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
}

// Contact related types
export interface GhlContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

// Message related types
export type MessageType = 
  | 'TYPE_SMS' 
  | 'TYPE_EMAIL' 
  | 'TYPE_CALL'
  | 'TYPE_VOICEMAIL'
  | 'TYPE_FACEBOOK'
  | 'TYPE_GMB'
  | 'TYPE_INSTAGRAM'
  | 'TYPE_WHATSAPP';

export interface GhlMessage {
  id: string;
  type: MessageType;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'failed';
  createdAt: string;
  contactId: string;
  locationId: string;
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

// Pagination related types
export interface PaginationParams {
  page?: number;
  limit?: number;
  startAfter?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextStartAfter?: string;
}

// Webhook related types
export interface GhlWebhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  secret?: string;
}

// Error types
export interface GhlError {
  code: string;
  message: string;
  details?: Record<string, any>;
}