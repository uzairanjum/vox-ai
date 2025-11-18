import { MessageType, MessageStatus } from '@/lib/leadconnector/types/messageTypes';

const TIME_UNITS = {
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000
};

export function formatMessageDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Today
  if (diff < TIME_UNITS.day && date.getDate() === now.getDate()) {
    return `Today at ${timeStr}`;
  }

  // Yesterday
  if (diff < 2 * TIME_UNITS.day && date.getDate() === now.getDate() - 1) {
    return `Yesterday at ${timeStr}`;
  }

  // Current year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Different year
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatMessageType(type: MessageType): string {
  return type
    .replace('TYPE_', '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function getStatusColor(status: MessageStatus): string {
  switch (status) {
    case 'delivered':
      return 'text-success';
    case 'read':
      return 'text-info';
    case 'failed':
    case 'undelivered':
      return 'text-destructive';
    case 'pending':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
}

export function formatSource(source?: string): string {
  if (!source) return '';
  
  switch (source.toLowerCase()) {
    case 'app':
      return 'Manual';
    case 'workflow':
      return 'Workflow';
    case 'campaign':
      return 'Campaign';
    default:
      return source;
  }
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format: (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  
  // Format: +X (XXX) XXX-XXXX
  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  
  return phone;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${Math.round(size)}${units[unit]}`;
}