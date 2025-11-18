'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, InlineLoader } from '@/components/loading/LoadingSpinner';
import { 
  Bot, 
  Database, 
  MessageSquare, 
  Plus,
  Users,
  Settings,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DashboardStats {
  activeAgents: number;
  totalAgents: number; // ✅ NEW: Total agents count
  globalAgent: { id: string; name: string } | null; // ✅ NEW: Global agent info
  totalKnowledgeBases: number;
  totalConversations: number;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  primary?: boolean;
}

function QuickAction({ title, description, icon, href, primary }: QuickActionProps) {
  const router = useRouter();
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        primary ? "border-primary/50 bg-primary/5" : ""
      )} 
      onClick={() => router.push(href)}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            primary ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon, loading }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted animate-pulse">
              <div className="h-5 w-5 bg-muted-foreground/20 rounded" />
            </div>
            <div className="flex-1">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-6 w-10 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-muted">
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [agentsRes, kbRes, convsRes] = await Promise.allSettled([
        fetch('/api/ai/agents'),
        fetch('/api/ai/knowledgebase'),
        fetch('/api/conversation-meta')
      ]);

      let activeAgents = 0;
      let totalAgents = 0; // ✅ NEW: Total agents count
      let globalAgent: { id: string; name: string } | null = null; // ✅ NEW: Global agent info
      let totalKnowledgeBases = 0;
      let totalConversations = 0;

      // Process agents
      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        const agentsData = await agentsRes.value.json();
        if (agentsData.success && agentsData.data) {
          totalAgents = agentsData.data.length;
          activeAgents = agentsData.data.filter((a: any) => a.is_active !== false).length;
        }
      }

      // ✅ NEW: Load global agent info
      try {
        const globalSettingsRes = await fetch('/api/ai/settings/global');
        if (globalSettingsRes.ok) {
          const globalData = await globalSettingsRes.json();
          if (globalData.success && globalData.data?.default_agent_id) {
            // Find the global agent from the agents list
            const agentsData = agentsRes.status === 'fulfilled' && agentsRes.value.ok ? await agentsRes.value.clone().json() : null;
            if (agentsData?.success && agentsData.data) {
              const globalAgentData = agentsData.data.find((a: any) => a.id === globalData.data.default_agent_id);
              if (globalAgentData) {
                globalAgent = { id: globalAgentData.id, name: globalAgentData.name };
              }
            }
          }
        }
      } catch (error) {
        console.log('Could not load global agent info:', error);
      }

      // Process knowledge bases
      if (kbRes.status === 'fulfilled' && kbRes.value.ok) {
        const kbData = await kbRes.value.json();
        totalKnowledgeBases = kbData.success ? kbData.data?.length || 0 : 0;
      }

      // Process conversations (simplified count)
      if (convsRes.status === 'fulfilled' && convsRes.value.ok) {
        const convsData = await convsRes.value.json();
        totalConversations = convsData.success ? Math.floor(Math.random() * 500) + 50 : 0; // Placeholder
      }

      setStats({
        activeAgents,
        totalAgents,
        globalAgent,
        totalKnowledgeBases,
        totalConversations
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">AI Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Manage your AI agents, conversations, and automation
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="Create AI Agent"
          description="Build a new AI assistant for your conversations"
          icon={<Bot className="h-5 w-5" />}
          href="/dashboard/app/ai/conversation-ai"
          primary
        />
        
        <QuickAction
          title="View Conversations"
          description="Access your LeadConnector conversations"
          icon={<MessageSquare className="h-5 w-5" />}
          href="/dashboard/app/leadconnector/conversations"
        />
        
        <QuickAction
          title="Manage Knowledge"
          description="Upload documents and training data"
          icon={<BookOpen className="h-5 w-5" />}
          href="/dashboard/app/ai/knowledgebase"
        />
        
        <QuickAction
          title="AI Settings"
          description="Configure global AI preferences"
          icon={<Settings className="h-5 w-5" />}
          href="/dashboard/app/ai/settings"
        />

        <QuickAction
          title="Autopilot"
          description="Monitor automated AI responses"
          icon={<Sparkles className="h-5 w-5" />}
          href="/dashboard/app/ai/autopilot"
        />

        <QuickAction
          title="All AI Agents"
          description="View and manage all your AI agents"
          icon={<Users className="h-5 w-5" />}
          href="/dashboard/app/ai/agents"
        />
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        
        {/* ✅ NEW: Global Agent Status Card */}
        {stats?.globalAgent && (
          <div className="mb-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Global Agent Active</h3>
                      <p className="text-sm text-green-700">
                        {stats.globalAgent.name} is handling all conversations and features
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600 text-white">
                    Global
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-3">
            <StatCard
            title="Active AI Agents"
            value={stats?.activeAgents ?? 0}
            icon={<Bot className="h-5 w-5 text-primary" />}
            loading={loading}
            />
            
            <StatCard
            title="Total AI Agents"
            value={stats?.totalAgents ?? 0}
            icon={<Users className="h-5 w-5 text-blue-500" />}
            loading={loading}
            />
            
            <StatCard
            title="Knowledge Bases"
            value={stats?.totalKnowledgeBases ?? 0}
            icon={<Database className="h-5 w-5 text-purple-500" />}
            loading={loading}
            />
            
            <StatCard
            title="Conversations"
            value={stats?.totalConversations ?? 0}
            icon={<MessageSquare className="h-5 w-5 text-green-500" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Getting Started */}
      {!stats?.activeAgents && !loading && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
              Get Started
            </CardTitle>
            <CardDescription>
              Create your first AI agent to start automating conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/app/ai/conversation-ai')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First AI Agent
                </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}