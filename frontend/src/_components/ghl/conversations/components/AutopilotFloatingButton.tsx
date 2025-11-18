'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutopilotSettings } from './AutopilotSettings';

interface AutopilotFloatingButtonProps {
  conversationId: string;
  className?: string;
}

export function AutopilotFloatingButton({ conversationId, className }: AutopilotFloatingButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [quickResponseEnabled, setQuickResponseEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load quick response status and determine visibility
  useEffect(() => {
    const loadQuickResponseStatus = async () => {
      try {
        const response = await fetch(`/api/autopilot/config?conversationId=${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          const enabled = data.config?.isEnabled || false;
          setQuickResponseEnabled(enabled);
          
          // Show button if quick response is enabled OR if user has interacted with it before
          const hasInteracted = localStorage.getItem(`quick-response-interacted-${conversationId}`) === 'true';
          setIsVisible(enabled || hasInteracted);
        } else {
          // Show a small hint button for first-time users
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error loading quick response status:', error);
        setIsVisible(false);
      }
    };
    
    loadQuickResponseStatus();
  }, [conversationId]);

  const handleButtonClick = () => {
    setShowPanel(true);
    // Mark that user has interacted with quick response
    localStorage.setItem(`quick-response-interacted-${conversationId}`, 'true');
    setIsVisible(true);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    // Hide after 3 seconds unless quick response is active
    if (!quickResponseEnabled) {
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
  };

  // Show a subtle hint for first-time users
  if (!isVisible && !quickResponseEnabled) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-40", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full h-10 w-10 bg-background/80 backdrop-blur border-secondary/30 hover:border-secondary shadow-sm"
              onClick={handleButtonClick}
            >
              <Zap className="h-4 w-4 text-secondary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Enable Quick Response</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Don't show anything if user minimized and quick response isn't active
  if (isMinimized && !quickResponseEnabled) {
    return null;
  }

  return (
    <>
      {/* Main Floating Button */}
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <div className="flex flex-col items-end gap-2">
          {/* Minimize button when expanded */}
          {!isMinimized && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full h-8 w-8 bg-background/80 backdrop-blur shadow-sm opacity-60 hover:opacity-100"
              onClick={handleMinimize}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {/* Main Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                className={cn(
                  "rounded-full h-14 w-14 shadow-lg transition-all duration-200",
                  quickResponseEnabled 
                    ? "bg-accent hover:bg-accent/90 animate-pulse" 
                    : "bg-secondary hover:bg-secondary/90"
                )}
                onClick={handleButtonClick}
              >
                <Zap className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{quickResponseEnabled ? 'Quick Response Active' : 'Configure Quick Response'}</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Status indicator */}
          {quickResponseEnabled && (
            <div className="text-xs text-accent font-medium bg-background/80 px-2 py-1 rounded shadow-sm">
              Active
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowPanel(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                Quick Response Settings
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-full pb-20">
              <AutopilotSettings 
                conversationId={conversationId}
                isCollapsed={false}
                onCollapsedChange={(collapsed) => {
                  if (collapsed) {
                    setShowPanel(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 