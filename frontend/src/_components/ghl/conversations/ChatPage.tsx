"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // connect to FastAPI WebSocket
    const socket = new WebSocket("ws://localhost:4000/ws/chat");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, "🤖 " + event.data]);
    };

    socket.onclose = () => {
      console.log("⚠ Disconnected from WebSocket server");
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (socketRef.current && input.trim()) {
      socketRef.current.send(input);
      setMessages((prev) => [...prev, "🧑 " + input]);
      setInput("");
    }
  };

  return (
    <></>
    //     <div style={{ padding: 20 }}>
    //       <h2>Chat with FastAPI</h2>
    //       <div style={{ border: "1px solid #ccc", height: 300, overflowY: "auto", padding: 10 }}>
    //         {messages.map((msg, idx) => (
    //           <div key={idx}>{msg}</div>
    //         ))}
    //       </div>

    //       <form onSubmit={sendMessage} style={{ marginTop: 10 }}>
    //         <input
    //           type="text"
    //           value={input}
    //           onChange={(e) => setInput(e.target.value)}
    //           style={{ padding: 8, width: "70%" }}
    //         />
    //         <button type="submit" style={{ padding: 8, marginLeft: 8 }}>
    //           Send
    //         </button>
    //       </form>
    //     </div>
  );
}
