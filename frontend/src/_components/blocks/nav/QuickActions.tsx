'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MessageSquare, 
  Bot, 
  Database, 
  Settings, 
  Search,
  FileText,
  Zap,
  Users,
  Mic,
  Clock,
  ChevronDown
} from 'lucide-react';

// Simple cache for conversations
interface CachedConversation {
  id: string;
  contactName?: string;
  lastMessage?: string;
  lastActivity?: string;
}

interface ConversationsCache {
  data: CachedConversation[];
  lastFetch: number;
  isLoading: boolean;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  highlight?: boolean;
  isDropdown?: boolean;
  submenu?: Array<{
    label: string;
    href: string;
    icon?: React.ReactNode;
  }>;
}

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Conversations cache state
  const [conversationsCache, setConversationsCache] = useState<ConversationsCache>({
    data: [],
    lastFetch: 0,
    isLoading: false
  });

  // Fetch recent conversations for quick access
  const fetchRecentConversations = async () => {
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - conversationsCache.lastFetch < CACHE_DURATION && conversationsCache.data.length > 0) {
      return conversationsCache.data;
    }

    if (conversationsCache.isLoading) return conversationsCache.data;

    setConversationsCache(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/leadconnector/conversations/search?limit=5');
      const data = await response.json();
      
      if (data?.conversations?.length) {
        const cachedConversations = data.conversations.map((conv: any) => ({
          id: conv.id,
          contactName: conv.contactName || conv.contact?.name || `Contact ${conv.id.slice(0, 8)}`,
          lastMessage: conv.lastMessage?.body?.substring(0, 50) + '...' || '',
          lastActivity: conv.lastMessageAt || conv.dateUpdated
        }));

        setConversationsCache({
          data: cachedConversations,
          lastFetch: now,
          isLoading: false
        });

        return cachedConversations;
      }
    } catch (error) {
      console.warn('Failed to fetch recent conversations:', error);
    }

    setConversationsCache(prev => ({ ...prev, isLoading: false }));
    return conversationsCache.data;
  };

  // Auto-fetch conversations when component mounts or when on conversations page
  useEffect(() => {
    if (pathname.includes('/conversations') || pathname === '/dashboard') {
      fetchRecentConversations();
    }
  }, [pathname]);

  // Generate quick actions based on current page
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    // Global search action (always available)
    actions.push({
      icon: <Search className="h-4 w-4" />,
      label: 'Search',
      variant: 'ghost',
      onClick: () => {
        // TODO: Implement global search modal
        console.log('Open global search');
      }
    });

    // Recent conversations dropdown
    if ((pathname.includes('/conversations') || pathname === '/dashboard') && conversationsCache.data.length > 0) {
      actions.push({
        icon: <Clock className="h-4 w-4" />,
        label: 'Recent Chats',
        variant: 'outline',
        isDropdown: true,
        submenu: conversationsCache.data.map(conv => ({
          label: conv.contactName || 'Unknown Contact',
          href: `/dashboard/app/leadconnector/conversations/${conv.id}`,
          icon: <MessageSquare className="h-3 w-3" />
        }))
      });
    }

    // Page-specific actions
    if (pathname.includes('/ai/agents')) {
      actions.push({
        icon: <Plus className="h-4 w-4" />,
        label: 'Create AI Agent',
        href: '/dashboard/app/ai/agents/new',
        highlight: true
      });
    }

    if (pathname.includes('/ai/knowledgebase')) {
      actions.push({
        icon: <Plus className="h-4 w-4" />,
        label: 'Add Knowledge Base',
        highlight: true,
        onClick: () => {
          // TODO: Open knowledge base creation modal
          router.push('/dashboard/app/ai/knowledgebase?action=create');
        }
      });
    }

    if (pathname.includes('/leadconnector/conversations') && !pathname.includes('/conversations/[')) {
      actions.push({
        icon: <MessageSquare className="h-4 w-4" />,
        label: 'All Conversations',
        href: '/dashboard/app/leadconnector/conversations',
        variant: 'outline'
      });
    }

    if (pathname.includes('/ai/conversation-ai')) {
      actions.push({
        icon: <Bot className="h-4 w-4" />,
        label: 'AI Agents',
        href: '/dashboard/app/ai/agents',
        variant: 'outline'
      });
    }

    if (pathname.includes('/ai/autopilot')) {
      actions.push({
        icon: <Settings className="h-4 w-4" />,
        label: 'Autopilot Settings',
        href: '/dashboard/app/ai/settings',
        variant: 'outline'
      });
    }

    // Dashboard quick actions
    if (pathname === '/dashboard') {
      actions.push(
        {
          icon: <Plus className="h-4 w-4" />,
          label: 'Create AI Agent',
          href: '/dashboard/app/ai/conversation-ai',
          highlight: true
        },
        {
          icon: <MessageSquare className="h-4 w-4" />,
          label: 'View Conversations',
          href: '/dashboard/app/leadconnector/conversations',
          variant: 'outline'
        },
        {
          icon: <Database className="h-4 w-4" />,
          label: 'Knowledge Base',
          href: '/dashboard/app/ai/knowledgebase',
          variant: 'outline'
        }
      );
    }

    return actions;
  };

  const actions = getQuickActions();

  if (actions.length === 0) {
    return null;
  }

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {actions.map((action, index) => (
        action.isDropdown && action.submenu ? (
          // Dropdown action
          <DropdownMenu key={index}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={action.highlight ? 'default' : action.variant || 'outline'}
                size="sm"
                className={action.highlight ? 'bg-primary text-primary-foreground' : ''}
              >
                {action.icon}
                <span className="hidden sm:inline ml-2">{action.label}</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {action.submenu.map((item, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={() => router.push(item.href)}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
              {action.submenu.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/app/leadconnector/conversations')}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>View All Conversations</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Regular button action
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant={action.highlight ? 'default' : action.variant || 'outline'}
                size="sm"
                onClick={() => handleAction(action)}
                className={action.highlight ? 'bg-primary text-primary-foreground' : ''}
              >
                {action.icon}
                <span className="hidden sm:inline ml-2">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        )
      ))}
    </div>
  );
} 