'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageSquare, Clock, ChevronRight, Search, RefreshCw, Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AutopilotConversation {
  conversationId: string;
  locationId?: string;
  lastCustomerMessage?: string;
  lastResponseAt?: string;
  isActive: boolean;
  responsesToday: number;
  totalResponses: number;
  agentName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  conversationName?: string;
  lastActivity?: string;
  conversationStatus?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    hasContactInfo?: boolean;
    hasConversationInfo?: boolean;
    setupDate?: string;
    contactSource?: string;
    dataQuality?: {
      hasUrlContactInfo?: boolean;
      hasApiContactInfo?: boolean;
      hasTrackingInfo?: boolean;
      contactInfoSource?: string;
    };
  };
}

export default function AutopilotDashboard() {
  const [conversations, setConversations] = useState<AutopilotConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadAutopilotConversations();
  }, []);

  const loadAutopilotConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/autopilot/conversations');
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.warn('Could not load autopilot conversations');
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading autopilot conversations:', error);
      toast.error('Failed to load autopilot conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.conversationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.conversationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactPhone?.includes(searchQuery) ||
      conv.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.agentName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && conv.isActive) ||
      (filterActive === 'inactive' && !conv.isActive);

    return matchesSearch && matchesFilter;
  });

  const totalActive = conversations.filter(c => c.isActive).length;
  const totalResponsesToday = conversations.reduce((sum, c) => sum + c.responsesToday, 0);

  // Loading state
  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-green-500" />
            Autopilot Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage conversations with AI autopilot enabled
          </p>
        </div>
        <Button variant="outline" onClick={loadAutopilotConversations} disabled={loading} className="h-8 w-8 p-0">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Autopilot</p>
                <p className="text-2xl font-bold text-green-600">{totalActive}</p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Responses Today</p>
                <p className="text-2xl font-bold text-blue-600">{totalResponsesToday}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {conversations.length > 0 ? Math.round((totalActive / conversations.length) * 100) : 0}%
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by contact name, phone, email, or conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full sm:w-80"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={filterActive === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterActive('all')}
          >
            All ({conversations.length})
          </Button>
          <Button
            variant={filterActive === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterActive('active')}
          >
            Active ({totalActive})
          </Button>
          <Button
            variant={filterActive === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterActive('inactive')}
          >
            Inactive ({conversations.length - totalActive})
          </Button>
        </div>
      </div>

      {/* Conversations */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No autopilot conversations found</h3>
              <p className="text-gray-500 mb-4">Enable autopilot on conversations to see them here. You can do this from the conversation settings.</p>
              <Link href="/dashboard/app/leadconnector/conversations">
                <Button>Go to Conversations</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredConversations.map((conversation) => (
              <Card key={conversation.conversationId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Bot className={cn(
                        "h-5 w-5",
                        conversation.isActive ? "text-green-500" : "text-gray-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {conversation.contactName && conversation.contactName !== 'Unknown Contact' 
                            ? conversation.contactName 
                            : conversation.conversationName 
                            ? conversation.conversationName
                            : `Conversation ${conversation.conversationId.slice(0, 8)}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {conversation.contactName && conversation.contactName !== 'Unknown Contact' && conversation.conversationName
                            ? `${conversation.conversationName} • ${conversation.conversationId.slice(0, 8)}`
                            : `ID: ${conversation.conversationId.slice(0, 12)}...`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={conversation.isActive ? 'default' : 'secondary'}>
                      {conversation.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-3 text-xs text-muted-foreground">
                    {conversation.contactPhone && (
                      <div className="flex items-center gap-1">
                        <span>📞</span>
                        <span className="font-mono">{conversation.contactPhone}</span>
                      </div>
                    )}
                    {conversation.contactEmail && (
                      <div className="flex items-center gap-1">
                        <span>📧</span>
                        <span className="truncate">{conversation.contactEmail}</span>
                      </div>
                    )}
                    {conversation.agentName && (
                      <div className="flex items-center gap-1">
                        <span>🤖</span>
                        <span className="truncate">{conversation.agentName}</span>
                      </div>
                    )}
                    {conversation.conversationStatus && conversation.conversationStatus !== 'open' && (
                      <div className="flex items-center gap-1">
                        <span>📋</span>
                        <span className="capitalize">{conversation.conversationStatus}</span>
                      </div>
                    )}
                    {conversation.metadata?.dataQuality?.hasUrlContactInfo && (
                      <div className="flex items-center gap-1 text-green-600">
                        <span>✅</span>
                        <span className="text-xs">Rich Contact Data</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <div className="font-semibold">{conversation.responsesToday}</div>
                        <div className="text-muted-foreground">Today</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{conversation.totalResponses}</div>
                        <div className="text-muted-foreground">Total</div>
                      </div>
                    </div>
                    
                    <Link href={`/dashboard/app/leadconnector/conversations/${conversation.conversationId}`}>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 