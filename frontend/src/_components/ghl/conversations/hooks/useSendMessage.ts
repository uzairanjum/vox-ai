import { useState } from 'react';

interface UseSendMessageProps {
  conversationId: string;
  conversationType?: string; // e.g., 'TYPE_SMS', 'TYPE_EMAIL', etc.
  contactId?: string;
}

export function useSendMessage({ conversationId, conversationType, contactId }: UseSendMessageProps) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string, messageType?: string) => {
    setIsSending(true);
    setError(null);

    try {
      // Determine message type from conversation type or use provided type
      const finalMessageType = messageType || conversationType || 'TYPE_SMS';
      
      console.log('Sending message:', {
        conversationId,
        messageType: finalMessageType,
        contactId,
        messageLength: message.length
      });

      const response = await fetch(`/api/leadconnector/conversations/${conversationId}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messageType: finalMessageType,
          contactId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending,
    error,
  };
}