// Knowledge Base Type Settings
export const KB_SETTINGS = {
  // Primary conversation knowledge base (one per conversation)
  KB_CONVERSATION: {
    type: 1,
    name: 'Conversation',
    description: 'Primary conversation context and history',
    icon: 'MessageSquare',
    isPrimary: true,
    autoCreated: true
  },
  
  // Custom knowledge bases (user created)
  KB_FILE_UPLOAD: {
    type: 2,
    name: 'File Upload',
    description: 'Documents, PDFs, text files',
    icon: 'FileText',
    isPrimary: false,
    autoCreated: false,
    supportedFormats: ['pdf', 'doc', 'docx', 'txt']
  },
  
  KB_FAQ: {
    type: 3,
    name: 'FAQ',
    description: 'Frequently asked questions and answers',
    icon: 'HelpCircle',
    isPrimary: false,
    autoCreated: false
  },
  
  KB_WEB_SCRAPER: {
    type: 4,
    name: 'Web Scraper',
    description: 'Content scraped from websites',
    icon: 'Globe',
    isPrimary: false,
    autoCreated: false
  }
} as const;

// Form type to database type mapping
export const FORM_TYPE_TO_DB_TYPE = {
  'file': KB_SETTINGS.KB_FILE_UPLOAD.type,
  'faq': KB_SETTINGS.KB_FAQ.type,
  'web': KB_SETTINGS.KB_WEB_SCRAPER.type,
  'conversation': KB_SETTINGS.KB_CONVERSATION.type
} as const;

// Database type to form type mapping
export const DB_TYPE_TO_FORM_TYPE = {
  [KB_SETTINGS.KB_FILE_UPLOAD.type]: 'file',
  [KB_SETTINGS.KB_FAQ.type]: 'faq',
  [KB_SETTINGS.KB_WEB_SCRAPER.type]: 'web',
  [KB_SETTINGS.KB_CONVERSATION.type]: 'conversation'
} as const;

// Category filter to type mapping for frontend filtering
export const CATEGORY_TO_TYPE = {
  'all': undefined,
  'conversation': KB_SETTINGS.KB_CONVERSATION.type,
  'files': KB_SETTINGS.KB_FILE_UPLOAD.type,
  'faq': KB_SETTINGS.KB_FAQ.type,
  'web': KB_SETTINGS.KB_WEB_SCRAPER.type
} as const;

// Type definitions for better type safety
export type FormKBType = keyof typeof FORM_TYPE_TO_DB_TYPE;
export type DBKBType = typeof KB_SETTINGS[keyof typeof KB_SETTINGS]['type'];
export type CategoryFilter = keyof typeof CATEGORY_TO_TYPE;

// Helper functions
export function getKBTypeInfo(type: number) {
  return Object.values(KB_SETTINGS).find(kb => kb.type === type);
}

export function getKBTypeName(type: number): string {
  const info = getKBTypeInfo(type);
  return info?.name || 'Unknown';
}

export function isConversationKB(type: number): boolean {
  return type === KB_SETTINGS.KB_CONVERSATION.type;
}

export function isPrimaryKB(type: number): boolean {
  const info = getKBTypeInfo(type);
  return info?.isPrimary || false;
}

export function getCustomKBTypes() {
  return Object.values(KB_SETTINGS).filter(kb => !kb.isPrimary);
}

export function getPrimaryKBTypes() {
  return Object.values(KB_SETTINGS).filter(kb => kb.isPrimary);
}

// New helper functions for form/database synchronization
export function convertFormTypeToDBType(formType: FormKBType): DBKBType {
  return FORM_TYPE_TO_DB_TYPE[formType];
}

export function convertDBTypeToFormType(dbType: DBKBType): FormKBType {
  return DB_TYPE_TO_FORM_TYPE[dbType as keyof typeof DB_TYPE_TO_FORM_TYPE];
}

export function getCategoryTypeFilter(category: CategoryFilter): number | undefined {
  return CATEGORY_TO_TYPE[category];
}

// Validation helpers
export function isValidFormType(type: string): type is FormKBType {
  return type in FORM_TYPE_TO_DB_TYPE;
}

export function isValidDBType(type: number): type is DBKBType {
  return Object.values(KB_SETTINGS).some(kb => kb.type === type);
}

// Get all available types for dropdowns/selects
export function getAllKBTypes() {
  return Object.values(KB_SETTINGS);
}

export function getCreatableKBTypes() {
  return Object.values(KB_SETTINGS).filter(kb => !kb.autoCreated);
}
