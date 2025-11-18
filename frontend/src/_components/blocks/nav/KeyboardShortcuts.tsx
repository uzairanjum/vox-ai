'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, Home, MessageSquare, Bot, Database, Settings, Search } from 'lucide-react';

interface Shortcut {
  key: string;
  description: string;
  icon?: React.ReactNode;
  action?: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input/textarea or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Global shortcuts (Cmd/Ctrl + key)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // TODO: Open global search
            console.log('Open search');
            break;
          case 'h':
            e.preventDefault();
            router.push('/dashboard');
            break;
          case 'm': // Changed from 'c' to 'm' for Messages/conversations
            e.preventDefault();
            router.push('/dashboard/app/leadconnector/conversations');
            break;
          case 'a':
            e.preventDefault();
            router.push('/dashboard/app/ai/agents');
            break;
          case 'b':
            e.preventDefault();
            router.push('/dashboard/app/ai/knowledgebase');
            break;
          case '/':
            e.preventDefault();
            setShowShortcuts(true);
            break;
        }
      }

      // Single key shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case '?':
            e.preventDefault();
            setShowShortcuts(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return { showShortcuts, setShowShortcuts };
}

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: Shortcut[] = [
    {
      key: `${modKey} + K`,
      description: 'Open search',
      icon: <Search className="h-4 w-4" />
    },
    {
      key: `${modKey} + H`,
      description: 'Go to dashboard',
      icon: <Home className="h-4 w-4" />
    },
    {
      key: `${modKey} + M`,
      description: 'Go to conversations',
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      key: `${modKey} + A`,
      description: 'Go to AI agents',
      icon: <Bot className="h-4 w-4" />
    },
    {
      key: `${modKey} + B`,
      description: 'Go to knowledge base',
      icon: <Database className="h-4 w-4" />
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      icon: <Command className="h-4 w-4" />
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {shortcut.icon}
                  <span className="text-sm">{shortcut.description}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {shortcut.key}
                </Badge>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 