'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { Send, Copy, Clock, MessageCircle, User, Bot, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationSettings {
  agents?: {
    query?: string;
    suggestions?: string;
    autopilot?: string;
  };
  features?: {
    query?: {
      enabled?: boolean;
      contextDepth?: number;
    };
    suggestions?: {
      enabled?: boolean;
      limit?: number;
      contextDepth?: number;
    };
  };
}

interface QueryInputProps {
  conversationId: string;
  locationId: string;
  disabled?: boolean;
  conversationSettings?: ConversationSettings | null;
}

interface QueryResponse {
  answer: string;
  suggestions?: string[];
  timestamp: string;
  query: string;
}

interface QueryHistory {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  metadata?: {
    message_count?: number;
    ai_config?: {
      model?: string;
      temperature?: number;
    };
    agent_id?: string;
  };
}

export function QueryInput({ conversationId, locationId, disabled, conversationSettings }: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 🆕 Add training deduplication
  const [isTrainingInProgress, setIsTrainingInProgress] = useState(false);
  const [lastTrainingAttempt, setLastTrainingAttempt] = useState<number>(0);

  // Background training function - triggers when AI generates query responses - WITH DEDUPLICATION
  const startBackgroundTraining = async () => {
    // 🆕 Prevent multiple simultaneous training calls
    if (isTrainingInProgress) {
      console.log('AUTO-TRAIN: Training already in progress, skipping...');
      return;
    }

    // 🆕 Check if we recently attempted training (within 30 seconds)
    const now = Date.now();
    if (now - lastTrainingAttempt < 30000) {
      console.log('AUTO-TRAIN: Training attempted recently, skipping...');
      return;
    }

    setIsTrainingInProgress(true);
    setLastTrainingAttempt(now);

    try {
      console.log('AUTO-TRAIN: Fetching messages for training...');
      
      const messagesResponse = await fetch(`/api/leadconnector/conversations/${conversationId}/messages?limit=100`);
      const messagesData = await messagesResponse.json();

      if (!messagesData?.messages?.messages?.length) {
        console.warn('No messages found for training');
        return;
      }

      const messages = messagesData.messages.messages;
      console.log(`AUTO-TRAIN: Training with ${messages.length} messages`);
        
      const trainResponse = await fetch(`/api/ai/conversation/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          conversationId,
          locationId,
          messages,
          temperature: 0.7,
          model: 'gpt-4o-mini',
          humanlikeBehavior: true,
          silent: true // Background training flag
        })
      });
      
      const trainData = await trainResponse.json();
      
      if (trainData?.success) {
        console.log('AUTO-TRAIN: Background training completed successfully');
        toast.success('Conversation trained automatically!', { duration: 2000 });
      } else {
        console.warn('Background training failed:', trainData?.error);
      }
    } catch (error) {
      console.error('Error in background training:', error);
      // Don't show error toast for background training failures
    } finally {
      setIsTrainingInProgress(false);
    }
  };

  // Load query history from database on mount
  useEffect(() => {
    loadQueryHistoryFromDatabase();
  }, [conversationId]);

  const loadQueryHistoryFromDatabase = async () => {
    try {
      // Fetch stored query history from knowledge base
      const response = await fetch(`/api/ai/knowledgebase?conversationId=${conversationId}&type=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          // Get the first (conversation) knowledge base
          const conversationKB = result.data[0];
          if (conversationKB.data?.query_history) {
            const dbHistory = conversationKB.data.query_history.map((item: any) => ({
              id: item.id,
              query: item.query,
              response: item.response,
              timestamp: item.timestamp,
              metadata: item.metadata
            }));
            setQueryHistory(dbHistory.slice(-50)); // Keep last 50 for modal
            console.log('📚 Loaded query history from database:', dbHistory.length, 'queries');
          }
        }
      }
    } catch (error) {
      console.error('Error loading query history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading || disabled) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      console.log('QueryInput', 'Processing query', { query: query.trim(), conversationId, locationId });

      // Check if conversation needs training and auto-train if necessary
      const needsTraining = await checkAndAutoTrain();
      if (needsTraining) {
        setIsLoading(false);
        return; // Training is now in progress, user can retry query after training completes
      }

      console.log('Query request:', {
        query: query.trim(),
        conversationId,
        locationId
      });

      const response = await fetch('/api/ai/conversation/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          conversationId,
          locationId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const fastApiResponse = data.data;
        const queryResponse: QueryResponse = {
          answer: fastApiResponse.answer,
          suggestions: fastApiResponse.suggestions || [],
          timestamp: new Date().toISOString(),
          query: query.trim()
        };
        setResponse(queryResponse);

        // Add to query history
        const historyEntry: QueryHistory = {
          id: Date.now().toString(),
          query: query.trim(),
          response: queryResponse.answer,
          timestamp: queryResponse.timestamp,
          metadata: {
            agent_id: 'auto' // Indicate this was auto-processed
          }
        };
        setQueryHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 queries

        toast.success('Query processed successfully!');
        setQuery(''); // Clear input after successful query
        
        console.log('QueryInput', 'Query processed successfully:', queryResponse.answer.substring(0, 100) + '...');
      } else {
        throw new Error(data.error || 'Failed to process query');
      }
      
    } catch (error) {
      console.error('QueryInput', 'Query processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query';
      toast.error(errorMessage);
      setResponse({ 
        answer: `Error: ${errorMessage}`, 
        timestamp: new Date().toISOString(), 
        query: query.trim(),
        suggestions: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced function to check training status and auto-train if needed
  const checkAndAutoTrain = async (): Promise<boolean> => {
    try {
      // First check if conversation is already trained
      const statusResponse = await fetch('/api/ai/conversation/training-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          locationId
        })
      });

      const statusData = await statusResponse.json();
      
      if (statusData.is_trained) {
        return false; // Already trained, no need to train
      }

      // REMOVED: Auto-training before query
      // console.log('AUTO-TRAIN: Conversation not trained, starting background training before query...');
      // toast.info('Training conversation automatically before processing query...', { duration: 3000 });
      // 
      // await startBackgroundTraining();
      // return true; // Training started, query should be retried later
      
      // Instead, just proceed with query (training is manual now)
      return false;
      
    } catch (error) {
      console.error('Error checking training status:', error);
      return false; // Proceed with query anyway
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* Query Input - Clean & Minimal */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about this conversation..."
            disabled={disabled || isLoading}
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50",
              "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
            )}
          />
          
          {/* Chat History Modal */}
          {queryHistory.length > 0 && (
            <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2 text-gray-500 hover:text-gray-700"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] w-full flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 border-b">
                  <DialogTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Query Chat History
                    <span className="text-sm font-normal text-gray-500">
                      ({queryHistory.length} queries)
                    </span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden p-6">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                    {queryHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No query history yet</p>
                        <p className="text-sm">Start asking questions to see your chat history here</p>
                      </div>
                    ) : (
                      queryHistory.map((item) => (
                        <div key={item.id} className="space-y-3">
                          {/* User Query */}
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="bg-primary/5 rounded-lg p-3">
                                <p className="text-sm leading-relaxed">{item.query}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{formatTime(item.timestamp)}</span>
                                {item.metadata?.ai_config?.model && (
                                  <span className="text-xs text-gray-400">• {item.metadata.ai_config.model}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* AI Response */}
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-secondary" />
                            </div>
                            <div className="flex-1">
                              <div className="bg-secondary/5 rounded-lg p-3 relative group">
                                <p className="text-sm leading-relaxed pr-8">{item.response}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(item.response)}
                                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              {item.metadata && (
                                <div className="text-xs text-gray-500 mt-1 space-x-3">
                                  {item.metadata.message_count && (
                                    <span>{item.metadata.message_count} messages analyzed</span>
                                  )}
                                  {item.metadata.ai_config?.temperature !== undefined && (
                                    <span>temp: {item.metadata.ai_config.temperature}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isLoading || disabled}
            className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Response - Clean Display */}
      {response && (
        <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">AI Response</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(response.answer)}
              className="h-6 w-6 p-0 text-secondary hover:text-secondary/80"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
            {response.answer}
          </div>

          {/* Suggestions */}
          {response.suggestions && response.suggestions.length > 0 && (
            <div className="border-t border-secondary/10 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-3 w-3 text-secondary" />
                <span className="text-xs font-medium text-secondary">Follow-up suggestions</span>
              </div>
              <div className="grid gap-1">
                {response.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion)}
                    className="text-xs text-left p-2 rounded bg-secondary/10 hover:bg-secondary/20 transition-colors text-gray-600 dark:text-gray-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 