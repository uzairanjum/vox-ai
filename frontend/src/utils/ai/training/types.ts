import { Message } from '@/lib/leadconnector/types/messageTypes';

export interface TrainRequestBody {
  conversationId: string;
  locationId: string;
  messages: Message[];
  lastMessageId?: string;
}

export interface TrainSuccessResponse {
  success: true;
  message: string;
  data: {
    conversationId: string;
    messageCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface TrainErrorResponse {
  success: false;
  error: string;
}

export type TrainResponse = TrainSuccessResponse | TrainErrorResponse;
