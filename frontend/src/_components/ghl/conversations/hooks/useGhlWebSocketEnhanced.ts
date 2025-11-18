// hooks/useGhlWebSocketEnhanced.ts
import { useCallback, useRef, useEffect, useState } from 'react';

interface UseGhlWebSocketReturn {
  // sendToGhlWebSocket: (data: any) => void;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

export const useGhlWebSocketEnhanced = (): UseGhlWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || reconnectAttempts.current >= maxReconnectAttempts) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      ws.current = new WebSocket('ws://127.0.0.1:4000/ai/conversation/chat');
      
      ws.current.onopen = () => {
        console.log('✅ Connected to GHL WebSocket');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received from GHL WebSocket:', data);
          
          // Handle different types of responses from FastAPI
          if (data.type === 'ghl_response') {
            // Process GHL API responses
            console.log('GHL API Response:', data.response);
          } else if (data.type === 'error') {
            console.error('GHL WebSocket error:', data.message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('❌ Disconnected from GHL WebSocket');
        setConnectionStatus('disconnected');
        
        // Exponential backoff for reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          setTimeout(() => connect(), delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [connect]);

  // const sendToGhlWebSocket = useCallback((data: any) => {
  //   if (ws.current?.readyState === WebSocket.OPEN) {
  //     try {
  //       const message = JSON.stringify({
  //         ...data,
  //         timestamp: new Date().toISOString(),
  //         messageId: Math.random().toString(36).substring(7)
  //       });
  //       ws.current.send(message);
  //       console.log('📤 Sent to GHL WebSocket:', data);
  //       return true;
  //     } catch (error) {
  //       console.error('Failed to send message to WebSocket:', error);
  //       return false;
  //     }
  //   } else {
  //     console.warn('WebSocket not connected, cannot send message');
  //     return false;
  //   }
  // }, []);

  return {
    // sendToGhlWebSocket,
    isConnected: connectionStatus === 'connected',
    connectionStatus
  };
};