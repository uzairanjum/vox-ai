'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  className?: string;
  overrides?: Record<string, string>; // Path to custom label mapping
}

export function Breadcrumbs({ className, overrides = {} }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home/dashboard root
    if (pathSegments[0] === 'dashboard') {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
        icon: <Home className="h-4 w-4" />
      });
      pathSegments.shift(); // Remove 'dashboard' from segments
    }

    // Build breadcrumbs from remaining segments
    let currentPath = '/dashboard';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Use override if available, otherwise format segment
      const label = overrides[currentPath] || formatSegment(segment);
      
      breadcrumbs.push({
        label,
        href: currentPath
      });
    });

    return breadcrumbs;
  };

  // Format path segment into readable label
  const formatSegment = (segment: string): string => {
    // Handle specific cases
    const formatMap: Record<string, string> = {
      'ai': 'AI',
      'leadconnector': 'LeadConnector',
      'conversation-ai': 'Conversation AI',
      'knowledgebase': 'Knowledge Base',
      'voice-ai': 'Voice AI',
      'autopilot': 'Autopilot',
      'agents': 'AI Agents',
      'settings': 'Settings',
      'conversations': 'Conversations',
      'profile': 'Profile',
      'app': 'Apps'
    };

    if (formatMap[segment]) {
      return formatMap[segment];
    }

    // Handle UUIDs and IDs - show first 8 characters
    if (segment.length > 20 && segment.includes('-')) {
      return `ID: ${segment.substring(0, 8)}...`;
    }

    // Default formatting: capitalize and replace hyphens
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs for root dashboard
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground/60" />
          )}
          
          {index === breadcrumbs.length - 1 ? (
            // Current page - not clickable
            <span className="flex items-center gap-2 font-medium text-foreground">
              {item.icon}
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb
            <Link
              href={item.href}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
} 