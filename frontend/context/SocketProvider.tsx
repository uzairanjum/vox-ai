"use client";

import { useUserId } from "@/hooks/useUserId";
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface ISocketProvider {
  children?: ReactNode;
  token?: string; // optional, can be passed from parent
}

interface ISocketContext {
  sendMessage: (msg: any) => void;
  socket: Socket | null;
}

const SocketContext = createContext<ISocketContext | null>(null);

export const SocketProvider: FC<ISocketProvider> = ({ children, token }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const userId = useUserId();

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_VOX_API_URL, {
      path: "/sockets",
      transports: ["websocket"],
      query: { userId },
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ Socket Connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket Disconnected:", socketInstance.id);
    });

    // cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  const sendMessage = useCallback(
    (messagePayload: any) => {
      if (!socket) return;

      console.log("messagePayload", messagePayload);
      socket.emit("chat_message", messagePayload);
    },
    [socket]
  );

  return (
    <SocketContext.Provider value={{ sendMessage, socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for easier usage
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
