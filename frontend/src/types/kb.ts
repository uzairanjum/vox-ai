export interface KnowledgeBaseRow {
  id: string;
  name: string;
  created_at: string;
  faq_count: number;
  file_count: number;
  web_count: number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  user_id: string;
  status: string;
  created_at: string;
  // updated_at: string;
  total_sources?: number;
  has_faqs?: boolean;
  has_web?: boolean;
  has_files?: boolean;
}

export interface KnowledgeBasesResponse {
  success: boolean;
  data: KnowledgeBase[];
  total: number;
}
