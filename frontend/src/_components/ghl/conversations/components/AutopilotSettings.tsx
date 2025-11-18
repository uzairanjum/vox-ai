'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, MessageSquare, Settings, Brain } from 'lucide-react';

import { getFeatureAIConfig, AIConfig } from '@/utils/ai/config/aiSettings';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle,
  PauseCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AutopilotConfig {
  id?: string;
  isEnabled: boolean;
  replyDelayMinutes: number;
  maxRepliesPerConversation: number;
  maxRepliesPerDay: number;
  operatingHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    days: number[];
  };
  requireHumanKeywords: string[];
  excludeKeywords: string[];
  fallbackMessage: string;
}

interface AutopilotStatus {
  responsesToday: number;
  responsesThisConversation: number;
  isCurrentlyActive: boolean;
  lastResponseAt?: string;
}

interface AutopilotSettingsProps {
  conversationId: string;
  className?: string;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const defaultConfig: AutopilotConfig = {
  isEnabled: false,
  replyDelayMinutes: 5,
  maxRepliesPerConversation: 3,
  maxRepliesPerDay: 10,
  operatingHours: {
    enabled: false,
    start: '09:00',
    end: '17:00',
    timezone: 'UTC',
    days: [1, 2, 3, 4, 5] // Monday to Friday
  },
  requireHumanKeywords: [],
  excludeKeywords: [],
  fallbackMessage: 'Thank you for your message. I\'ll get back to you as soon as possible.'
};

const defaultStatus: AutopilotStatus = {
  responsesToday: 0,
  responsesThisConversation: 0,
  isCurrentlyActive: false
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AutopilotSettings({ conversationId, className, isCollapsed = true, onCollapsedChange }: AutopilotSettingsProps) {
  const [config, setConfig] = useState<AutopilotConfig>(defaultConfig);
  const [status, setStatus] = useState<AutopilotStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(isCollapsed);

  useEffect(() => {
    loadConfig();
    loadQuickResponseStatus();
  }, [conversationId]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/autopilot/config?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig({
            ...defaultConfig,
            ...data.config,
            isEnabled: data.config.is_enabled || false,
            replyDelayMinutes: data.config.reply_delay_minutes || 5,
            maxRepliesPerConversation: data.config.max_replies_per_conversation || 3,
            maxRepliesPerDay: data.config.max_replies_per_day || 10,
            operatingHours: data.config.operating_hours || defaultConfig.operatingHours,
            requireHumanKeywords: data.config.require_human_keywords || [],
            excludeKeywords: data.config.exclude_keywords || [],
            fallbackMessage: data.config.fallback_message || defaultConfig.fallbackMessage
          });
        }
      }
    } catch (error) {
      console.error('Error loading quick response config:', error);
      toast.error('Failed to load quick response settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuickResponseStatus = async () => {
    try {
      // This would come from your quick response analytics/tracking tables
      setStatus({
        responsesToday: 2,
        responsesThisConversation: 1,
        isCurrentlyActive: config.isEnabled && isWithinOperatingHours(),
        lastResponseAt: '2024-01-15T14:30:00Z'
      });
    } catch (error) {
      console.error('Error loading quick response status:', error);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/autopilot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          ...config
        })
      });

      if (response.ok) {
        toast.success('Quick Response settings saved successfully');
        loadQuickResponseStatus(); // Refresh status
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving quick response config:', error);
      toast.error('Failed to save quick response settings');
    } finally {
      setIsSaving(false);
    }
  };

  const isWithinOperatingHours = () => {
    if (!config.operatingHours.enabled) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    const startHour = parseInt(config.operatingHours.start.split(':')[0]);
    const endHour = parseInt(config.operatingHours.end.split(':')[0]);
    
    return config.operatingHours.days.includes(currentDay) && 
           currentHour >= startHour && 
           currentHour < endHour;
  };

  const getStatusColor = () => {
    if (!config.isEnabled) return 'text-muted-foreground';
    if (status.isCurrentlyActive) return 'text-accent';
    return 'text-secondary';
  };

  const getStatusIcon = () => {
    if (!config.isEnabled) return PauseCircle;
    if (status.isCurrentlyActive) return CheckCircle;
    return AlertCircle;
  };

  const handleCollapsedChange = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const StatusIcon = getStatusIcon();

  if (isLoading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-pulse text-muted-foreground">Loading quick response settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleCollapsedChange(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-secondary" />
            <div>
              <CardTitle className="text-base">Quick Response</CardTitle>
              <CardDescription className="text-sm">
                Automated AI responses for this conversation
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <Badge variant={config.isEnabled ? (status.isCurrentlyActive ? "default" : "secondary") : "outline"} className="text-xs">
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.isEnabled ? (status.isCurrentlyActive ? 'Active' : 'Scheduled') : 'Disabled'}
            </Badge>
            
            {/* Quick Stats */}
            {config.isEnabled && (
              <div className="text-xs text-muted-foreground">
                {status.responsesToday}/{config.maxRepliesPerDay} today
              </div>
            )}
            
            {/* Collapse Toggle */}
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-6">
          {/* Main Toggle - Simplified */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary/5 to-accent/5 rounded-lg border border-secondary/20">
            <div className="space-y-1">
              <Label className="text-lg font-semibold">Enable Quick Response</Label>
              <p className="text-sm text-muted-foreground">
                AI will automatically respond to customer messages with smart, context-aware replies
              </p>
            </div>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, isEnabled: enabled }))}
              className="scale-125"
            />
          </div>

          {config.isEnabled && (
            <>
              <Separator />
              
              {/* Quick Settings - Simplified */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="replyDelay">Response Delay (minutes)</Label>
                  <Select
                    value={config.replyDelayMinutes.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, replyDelayMinutes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute (instant)</SelectItem>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxReplies">Max replies per day</Label>
                  <Select
                    value={config.maxRepliesPerDay.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, maxRepliesPerDay: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 replies</SelectItem>
                      <SelectItem value="10">10 replies</SelectItem>
                      <SelectItem value="20">20 replies</SelectItem>
                      <SelectItem value="50">50 replies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Operating Hours Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Business Hours Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only send responses during business hours
                    </p>
                  </div>
                  <Switch
                    checked={config.operatingHours.enabled}
                    onCheckedChange={(enabled) => setConfig(prev => ({
                      ...prev,
                      operatingHours: { ...prev.operatingHours, enabled }
                    }))}
                  />
                </div>

                {config.operatingHours.enabled && (
                  <div className="ml-6 space-y-3 p-3 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={config.operatingHours.start}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            operatingHours: { ...prev.operatingHours, start: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={config.operatingHours.end}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            operatingHours: { ...prev.operatingHours, end: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />
              
              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={saveConfig} 
                  disabled={isSaving}
                  className="min-w-24 bg-secondary hover:bg-secondary/90"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
} 