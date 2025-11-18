// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';
interface UseWebSocketReturn {
  sendMessage: (message: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  readyState: number;
  lastMessage: string | null;
}
const socket = io('ws://127.0.0.1:4000/ai/conversation/chat');
const useWebSocket = (
  url: string, 
  onMessage: (data: string) => void, 
  options: {
    onOpen?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
    reconnect?: boolean;
    reconnectInterval?: number;
  } = {}
): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const connect = useCallback(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = (event: Event) => {
      setReadyState(WebSocket.OPEN);
      console.log('Connected to WebSocket');
      options.onOpen?.(event);
    };

    ws.current.onmessage = (event: MessageEvent) => {
      setLastMessage(event.data);
      onMessage(event.data);
    };

    ws.current.onclose = (event: CloseEvent) => {
      setReadyState(WebSocket.CLOSED);
      console.log('WebSocket connection closed');
      options.onClose?.(event);

      // Reconnect logic
      if (options.reconnect) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, options.reconnectInterval || 3000);
      }
    };

    ws.current.onerror = (event: Event) => {
      console.error('WebSocket error:', event);
      options.onError?.(event);
    };
  }, [url, onMessage, options]);

  // useEffect(() => {
  //   connect();

  //   // Cleanup on unmount
  //   return () => {
  //     if (reconnectTimeout.current) {
  //       clearTimeout(reconnectTimeout.current);
  //     }
  //     if (ws.current?.readyState === WebSocket.OPEN) {
  //       ws.current.close();
  //     }
  //   };
  // }, [connect]);
const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // connect to FastAPI WebSocket
    const socket = new WebSocket("ws://localhost:4000/ws/chat");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      // setMessages((prev) => [...prev, "🤖 " + event.data]);
    };

    socket.onclose = () => {
      console.log("⚠ Disconnected from WebSocket server");
    };

    return () => {
      socket.close();
    };
  }, []);
  // Function to send messages
  const sendMessage = useCallback((message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  }, []);

  return { sendMessage, readyState, lastMessage };
};

export default useWebSocket;