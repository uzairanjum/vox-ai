import { Message } from './messageTypes';

export interface TrainingData {
  messages: Message[];
  locationId: string;
  lastMessageId?: string;
  hasMore: boolean;
  loadMore?: () => Promise<void>;
  isTrained: boolean;
  status: 'pending' | 'training' | 'completed' | 'failed';
  messageCount: number;
  vectorCount: number;
  summary?: string;
}

export interface TrainingResponse {
  success: boolean;
  data?: TrainingData;
  error?: string;
} 