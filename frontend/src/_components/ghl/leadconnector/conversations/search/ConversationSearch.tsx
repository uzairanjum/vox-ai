"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getConversations } from "./getConversations";

interface Conversation {
  id: string;
  contact?: {
    name?: string;
    id?: string;
  };
  lastMessage?: {
    text?: string;
    createdAt?: string;
  };
}

export function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getConversations();
      setConversations(result?.conversations || []);
    } catch (err) {
      console.error("Error loading conversations:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load conversations";
      setError(errorMessage);
      
      // If it's a missing location ID error, suggest reconnection
      if (errorMessage.includes("Missing required auth cookies")) {
        setError("Missing location ID. Please reconnect your LeadConnector account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Conversations</CardTitle>
        <Button onClick={loadConversations} disabled={loading}>
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            "Get Conversations"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {error.includes("reconnect") && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = "/dashboard/app/leadconnector"}
                  >
                    Go to Lead Connector Settings
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {conversations.length === 0 && !loading && !error ? (
          <p className="text-muted-foreground">No conversations loaded yet. Click "Get Conversations" to load them.</p>
        ) : conversations.length === 0 && !loading && error ? (
          <p className="text-muted-foreground">Unable to load conversations due to the error above.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((convo) => (
                <TableRow key={convo.id}>
                  <TableCell>{convo.contact?.name || "Unknown"}</TableCell>
                  <TableCell>{convo.lastMessage?.text || "No message"}</TableCell>
                  <TableCell>
                    {convo.lastMessage?.createdAt
                      ? new Date(convo.lastMessage.createdAt).toLocaleString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
