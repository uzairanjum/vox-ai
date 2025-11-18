// hooks/useGhlWebSocket.ts
import { useCallback, useRef, useEffect } from 'react';

interface UseGhlWebSocketReturn {
  // sendToGhlWebSocket: (data: any) => void;
  isConnected: boolean;
}

export const useGhlWebSocket = (): UseGhlWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const isConnected = useRef(false);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      ws.current = new WebSocket('ws://127.0.0.1:4000/ai/conversation/chat');
      
      ws.current.onopen = () => {
        console.log('✅ Connected to GHL WebSocket');
        isConnected.current = true;
      };

      ws.current.onmessage = (event) => {
        console.log('📨 Received from GHL WebSocket:', event.data);
        // Handle incoming messages if needed
      };

      ws.current.onclose = () => {
        console.log('❌ Disconnected from GHL WebSocket');
        isConnected.current = false;
        // Attempt reconnect after delay
        setTimeout(() => connect(), 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
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
  //       const message = JSON.stringify(data);
  //       ws.current.send(message);
  //       console.log('📤 Sent to GHL WebSocket:', data);
  //     } catch (error) {
  //       console.error('Failed to send message to WebSocket:', error);
  //     }
  //   } else {
  //     console.warn('WebSocket not connected, cannot send message');
  //   }
  // }, []);

  return {
    // sendToGhlWebSocket,
    isConnected: isConnected.current
  };
};