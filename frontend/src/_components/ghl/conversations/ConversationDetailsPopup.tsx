'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Phone, Mail, MessageSquare, Calendar, Tag } from 'lucide-react';
import { Conversation } from '@/lib/leadconnector/types/conversationTypes';
import { formatMessageDate, formatMessageType, formatPhoneNumber } from './utils/formatters';
import { MessageType } from './types';
import { toast } from 'sonner';

interface ConversationDetailsPopupProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationDetailsPopup({ 
  conversation, 
  isOpen, 
  onClose 
}: ConversationDetailsPopupProps) {
  if (!conversation) return null;

  const contactName = conversation.fullName ||
    conversation.contactName ||
    conversation.email ||
    conversation.phone ||
    'Unknown Contact';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{contactName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(contactName, 'Contact name')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              {conversation.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{conversation.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => conversation.email && copyToClipboard(conversation.email, 'Email')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {conversation.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatPhoneNumber(conversation.phone)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => conversation.phone && copyToClipboard(conversation.phone, 'Phone')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Status */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversation Status
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Type</span>
                <Badge variant="outline" className="text-xs">
                  {formatMessageType(conversation.type.replace('CONVERSATION_', 'TYPE_') as MessageType)}
                </Badge>
              </div>
              
              {conversation.unreadCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Unread Messages</span>
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {conversation.unreadCount}
                  </Badge>
                </div>
              )}
              
              {conversation.lastMessageDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Last Activity</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{formatMessageDate(conversation.lastMessageDate)}</span>
                  </div>
                </div>
              )}
              
              {conversation.lastMessageDirection && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Last Message</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs capitalize">{conversation.lastMessageDirection}</span>
                    {conversation.lastOutboundMessageAction === 'automated' && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                        Auto
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags ({conversation.tags.length})
              </h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex flex-wrap gap-1.5">
                  {conversation.tags.map(tag => (
                    <Badge 
                      key={tag}
                      variant="outline" 
                      className={`text-xs ${
                        tag === 'vox-ai' 
                          ? 'bg-primary/10 text-primary border-primary/30 font-medium' 
                          : 'bg-secondary/10 text-secondary border-secondary/20'
                      }`}
                    >
                      {tag === 'vox-ai' && '🤖 '}
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Last Message Preview */}
          {conversation.lastMessageBody && (
            <div>
              <h4 className="text-sm font-medium mb-2">Last Message Preview</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {conversation.lastMessageBody}
                </p>
              </div>
            </div>
          )}

          {/* Vox-AI Status */}
          {conversation.tags?.includes('vox-ai') && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                🤖 Vox-AI Status
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-green-800 font-medium">
                    Autopilot Active
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  This conversation has automatic AI responses enabled.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 