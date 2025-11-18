// pages/api/ws.ts
import { WebSocketServer, WebSocket } from 'ws';
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

// Maintain active connections
const clients = new Set<WebSocket>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use a more direct type assertion
  const server = (req as any).socket?.server as {
    ws?: WebSocketServer;
    on(event: 'upgrade', listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void): void;
  };
  
  if (!server) {
    res.status(500).send('Server not available');
    return;
  }

  // Check if the WebSocket server is already initialized
  if (server.ws) {
    res.status(400).send('WebSocket server already initialized');
    return;
  }

  // Initialize WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('Client connected');

    // Use the correct event listener syntax for 'ws' library
    ws.on('message', (data: Buffer, isBinary: boolean) => {
      // Broadcast message to all clients
      const message = isBinary ? data : data.toString();
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message, { binary: isBinary });
        }
      });
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Store the WebSocket server instance for reuse
  server.ws = wss;

  // Handle the upgrade request
  server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    if (request.url === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  res.status(200).send('WebSocket server initialized');
}

// Prevent Next.js from parsing the body
export const config = {
  api: {
    bodyParser: false,
  },
};