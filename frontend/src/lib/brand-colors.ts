// Brand Color Utilities
// Centralized color mapping to ensure brand consistency

export const brandColors = {
  // Main brand colors
  query: {
    bg: 'bg-primary',
    text: 'text-primary',
    bgMuted: 'bg-primary/10',
    textMuted: 'text-primary/70',
    bgHover: 'hover:bg-primary/90',
    border: 'border-primary/20',
    ring: 'ring-primary/20'
  },
  suggestions: {
    bg: 'bg-secondary',
    text: 'text-secondary',
    bgMuted: 'bg-secondary/10',
    textMuted: 'text-secondary/70',
    bgHover: 'hover:bg-secondary/90',
    border: 'border-secondary/20',
    ring: 'ring-secondary/20'
  },
  autopilot: {
    bg: 'bg-accent',
    text: 'text-accent',
    bgMuted: 'bg-accent/10',
    textMuted: 'text-accent/70',
    bgHover: 'hover:bg-accent/90',
    border: 'border-accent/20',
    ring: 'ring-accent/20'
  },
  success: {
    bg: 'bg-secondary',
    text: 'text-secondary',
    bgMuted: 'bg-secondary/10',
    textMuted: 'text-secondary/70',
    bgHover: 'hover:bg-secondary/90',
    border: 'border-secondary/20'
  },
  info: {
    bg: 'bg-primary',
    text: 'text-primary',
    bgMuted: 'bg-primary/10',
    textMuted: 'text-primary/70',
    bgHover: 'hover:bg-primary/90',
    border: 'border-primary/20'
  }
} as const;

// Agent type color mappings (using brand colors)
export const agentTypeColors = {
  1: brandColors.query,    // Query agents use primary (pink/red)
  2: brandColors.suggestions, // Suggestion agents use secondary (orange)  
  3: brandColors.autopilot, // Response/Autopilot agents use accent (blue-gray)
  query: brandColors.query,
  suggestions: brandColors.suggestions,
  response: brandColors.autopilot,
  autopilot: brandColors.autopilot
} as const;

// Knowledge base type color mappings (using brand colors)
export const kbTypeColors = {
  1: brandColors.query,       // Conversation KB - primary
  2: brandColors.autopilot,   // File upload KB - accent  
  3: brandColors.suggestions, // FAQ KB - secondary
  4: brandColors.info,        // Web scraper KB - primary variant
} as const;

// Utility functions
export const getAgentTypeColor = (type: number | string) => {
  return agentTypeColors[type as keyof typeof agentTypeColors] || brandColors.query;
};

export const getKBTypeColor = (type: number) => {
  return kbTypeColors[type as keyof typeof kbTypeColors] || brandColors.query;
};

// Status color mappings (using brand colors)
export const statusColors = {
  active: brandColors.success,
  inactive: 'bg-muted text-muted-foreground',
  error: 'bg-destructive text-destructive-foreground',
  warning: brandColors.suggestions,
  pending: brandColors.autopilot
} as const;

// Badge variants using brand colors
export const brandBadgeVariants = {
  query: `${brandColors.query.bgMuted} ${brandColors.query.text} ${brandColors.query.border}`,
  suggestions: `${brandColors.suggestions.bgMuted} ${brandColors.suggestions.text} ${brandColors.suggestions.border}`,
  autopilot: `${brandColors.autopilot.bgMuted} ${brandColors.autopilot.text} ${brandColors.autopilot.border}`,
  success: `${brandColors.success.bgMuted} ${brandColors.success.text} ${brandColors.success.border}`,
  info: `${brandColors.info.bgMuted} ${brandColors.info.text} ${brandColors.info.border}`
} as const; 