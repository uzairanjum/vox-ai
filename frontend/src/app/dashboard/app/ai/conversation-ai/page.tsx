'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { 
  MessageSquare, 
  Bot, 
  Plus, 
  Settings, 
  Activity,
  TrendingUp,
  Users,
  Brain,
  ArrowRight, 
  CheckCircle,
  Zap
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: number;
  is_active: boolean;
  created_at: string;
}

export default function ConversationAIPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversationAgents();
  }, []);

  const loadConversationAgents = async () => {
    try {
      const response = await fetch('/api/ai/agents?conversation_only=true');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Error loading conversation agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversationAgents = agents.filter(a => [1, 2, 3, 4].includes(a.type));
  const activeAgents = conversationAgents.filter(a => a.is_active);

  if (loading) {
        return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="h-8 w-8" />
            </div>
          </div>
        );
  }

        return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              Conversation AI
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage AI agents that handle customer conversations and support
              </p>
            </div>
            
          <Button onClick={() => router.push('/dashboard/app/ai/agents/new?type=1')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Conversation Agent
          </Button>
                </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              <div>
                  <p className="text-2xl font-bold">{conversationAgents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                  <div>
                  <p className="text-2xl font-bold">{activeAgents.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-xs text-muted-foreground">Availability</p>
                </div>
                </div>
              </CardContent>
            </Card>
            
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">95%</p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="agents">Conversation Agents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {conversationAgents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  No conversation agents yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first conversation AI agent to start handling customer interactions automatically.
                </p>
                <Button onClick={() => router.push('/dashboard/app/ai/agents/new?type=1')} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {conversationAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge variant={agent.is_active ? "default" : "secondary"}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
            </div>
                    <CardDescription>
                      {agent.type === 1 && "AI Agent"}
                      {agent.type === 2 && "Query Agent"} 
                      {agent.type === 3 && "Suggestions Agent"}
                      {agent.type === 4 && "Response Agent"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/app/ai/agents`)}
                      >
                        Manage <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
          </div>
                  </CardContent>
                </Card>
        ))}
      </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Conversation AI Settings
              </CardTitle>
              <CardDescription>
                Configure global settings for conversation AI agents
              </CardDescription>
        </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/dashboard/app/ai/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Open AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Conversation Analytics
              </CardTitle>
              <CardDescription>
                View performance metrics for your conversation AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics dashboard coming soon...
              </p>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 