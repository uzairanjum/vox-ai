// @ts-nocheck

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/utils/auth/user';
import { getSupabase } from '@/utils/supabase/getSupabase';
import { postFastAPI } from '@/lib/fastapi-utils';
import { 
  KnowledgeBase, 
  KnowledgeBaseInsert, 
  KnowledgeBaseResponse,
  WebScrapedData 
} from '@/utils/database/knowledgebase';
import { KB_SETTINGS } from '@/utils/ai/knowledgebaseSettings';
import { PROVIDER_TYPE } from '@/utils/config/providerTypes';

interface ErrorResponse {
  success: false;
  error: string;
}

interface WebScrapeRequest {
  url: string;
  options?: {
    includeImages?: boolean;
    includeLinks?: boolean;
    maxDepth?: number;
    followExternalLinks?: boolean;
  };
  metadata?: Record<string, any>;
}

interface ScrapedContent {
  title: string;
  content: string;
  links: string[];
  images: string[];
  wordCount: number;
}

// Simple web scraper function (in production, you'd use a more robust solution)
async function scrapeWebsite(url: string, options: WebScrapeRequest['options'] = {}): Promise<ScrapedContent> {
  try {
    console.log('Scraping website:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBase-Scraper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Basic HTML parsing (in production, use a proper HTML parser like cheerio)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Remove script and style tags
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Extract links if requested
    const links: string[] = [];
    if (options.includeLinks) {
      const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
      for (const match of linkMatches) {
        const href = match[1];
        if (href.startsWith('http') || href.startsWith('/')) {
          links.push(href);
        }
      }
    }
    
    // Extract images if requested
    const images: string[] = [];
    if (options.includeImages) {
      const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
      for (const match of imgMatches) {
        const src = match[1];
        if (src.startsWith('http') || src.startsWith('/')) {
          images.push(src);
        }
      }
    }
    
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      title,
      content,
      links: [...new Set(links)], // Remove duplicates
      images: [...new Set(images)], // Remove duplicates
      wordCount
    };
    
  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// POST - Scrape website and create knowledge base entry
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized'
      } satisfies ErrorResponse, { status: 401 });
    }

    const body = await req.json() as WebScrapeRequest;
    
    // Validate required fields
    if (!body.url) {
      return Response.json({
        success: false,
        error: 'Missing required field: url'
      } satisfies ErrorResponse, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return Response.json({
        success: false,
        error: 'Invalid URL format'
      } satisfies ErrorResponse, { status: 400 });
    }

    console.log('Web scrape request:', {
      userId: user.id,
      url: body.url,
      options: body.options
    });

    // Scrape the website
    let scrapedContent: ScrapedContent;
    try {
      scrapedContent = await scrapeWebsite(body.url, body.options);
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape website'
      } satisfies ErrorResponse, { status: 400 });
    }

    const supabase = await getSupabase();
    
    // Generate unique scrape ID
    const scrapeId = crypto.randomUUID();
    const scrapedAt = new Date().toISOString();
    
    // Prepare scraped data
    const webData: WebScrapedData = {
      url: body.url,
      title: scrapedContent.title,
      content: scrapedContent.content,
      scraped_at: scrapedAt,
      metadata: {
        word_count: scrapedContent.wordCount,
        links: scrapedContent.links,
        images: scrapedContent.images,
        scrape_options: body.options,
        ...body.metadata
      }
    };

    // Create knowledge base entry
    const insertData: KnowledgeBaseInsert = {
      name: `Website: ${scrapedContent.title || body.url}`,
      type: KB_SETTINGS.KB_WEB_SCRAPER.type,
      user_id: user.id,
      provider_type: PROVIDER_TYPE.GHL_LOCATION, // Default provider
      provider_type_sub_id: scrapeId,
      data: {
        web_data: webData,
        scrape_date: scrapedAt,
        processing_status: 'completed',
        content_length: scrapedContent.content.length,
        metadata: {
          ...body.metadata,
          scraped_by: user.id,
          scrape_method: 'api',
          url_domain: new URL(body.url).hostname
        }
      },
      summary: scrapedContent.content.length > 500 
        ? scrapedContent.content.substring(0, 500) + '...' 
        : scrapedContent.content,
      faq: []
    };

    const { data, error } = await supabase
      .from('knowledge_bases')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating web scrape knowledge base:', error);
      return Response.json({
        success: false,
        error: 'Failed to create web scrape knowledge base'
      } satisfies ErrorResponse, { status: 500 });
    }

    console.log('Website scraped successfully:', {
      knowledgeBaseId: data.id,
      scrapeId: scrapeId,
      url: body.url,
      wordCount: scrapedContent.wordCount,
      contentLength: scrapedContent.content.length
    });

    // Use FastAPI website crawling for better content extraction
    try {
      const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
      
      const crawlResponse = await postFastAPI('/ai/conversation/training/website', {
          userId: user.id,
        name: `Website: ${scrapedContent.title || body.url}`,
        url: body.url,
          knowledgebaseId: data.id,
        priority: 1,
        metadata: {
          source: 'web_scraper',
          url: body.url,
          description: scrapedContent.content.length > 500 
            ? scrapedContent.content.substring(0, 500) + '...' 
            : scrapedContent.content,
          created_at: new Date().toISOString()
        }
      }, { userId: user.id });

      if (crawlResponse.ok) {
        const crawlData = await crawlResponse.json();
        console.log('Website crawling completed:', crawlData);
        
        // Update knowledge base with crawl results
        await supabase
          .from('knowledge_bases')
          .update({
            data: {
              ...data.data,
              processing_status: 'completed',
              crawl_results: crawlData,
              documents_processed: crawlData.documentsProcessed || 1,
              vectors_created: crawlData.vectorsCreated || 0,
              last_crawled_at: crawlData.timestamp || new Date().toISOString(),
              extracted_content: crawlData.extractedContent || scrapedContent.content
            }
          })
          .eq('id', data.id);

        return Response.json({
          success: true,
          data: data as KnowledgeBase
        } satisfies KnowledgeBaseResponse);
      } else {
        const errorText = await crawlResponse.text();
        console.error('FastAPI crawling failed:', errorText);
        
        // Update status to failed but still return the basic scraped data
        await supabase
          .from('knowledge_bases')
          .update({
            data: {
              ...data.data,
              processing_status: 'failed',
              training_error: errorText,
              fallback_content: scrapedContent.content
            }
          })
          .eq('id', data.id);
      }
    } catch (fastApiError) {
      console.error('FastAPI crawling failed, using basic scraping:', fastApiError);
      
      // Update status to indicate fallback was used
      await supabase
        .from('knowledge_bases')
        .update({
          data: {
            ...data.data,
            processing_status: 'completed_fallback',
            training_error: fastApiError instanceof Error ? fastApiError.message : 'FastAPI unavailable',
            fallback_content: scrapedContent.content
          }
        })
        .eq('id', data.id);
    }

    // Return the basic scraped data (either as fallback or if FastAPI succeeded)
    return Response.json({
      success: true,
      data: data as KnowledgeBase
    } satisfies KnowledgeBaseResponse);

  } catch (error) {
    console.error('Error in web scrape:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
} 