'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { Bot, MessageSquare, BookOpen, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'agent' | 'conversation' | 'knowledgebase';
  href: string;
  metadata?: Record<string, any>;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const searchQuery = searchParams?.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search AI Agents
      try {
        const agentsResponse = await fetch('/api/ai/agents');
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json();
          if (agentsData.success && agentsData.data) {
            const matchingAgents = agentsData.data.filter((agent: any) =>
              agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            searchResults.push(...matchingAgents.map((agent: any) => ({
              id: agent.id,
              title: agent.name,
              description: agent.description || 'No description available',
              type: 'agent' as const,
              href: `/dashboard/app/ai/agents/${agent.id}`,
              metadata: {
                type: agent.type,
                is_active: agent.is_active,
                created_at: agent.created_at
              }
            })));
          }
        }
      } catch (error) {
        console.log('Could not search agents:', error);
      }

      // Search Knowledge Bases
      try {
        const kbResponse = await fetch('/api/ai/knowledgebase');
        if (kbResponse.ok) {
          const kbData = await kbResponse.json();
          if (kbData.success && kbData.data) {
            const matchingKBs = kbData.data.filter((kb: any) =>
              kb.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            searchResults.push(...matchingKBs.map((kb: any) => ({
              id: kb.id,
              title: kb.name || 'Untitled Knowledge Base',
              description: kb.description || 'No description available',
              type: 'knowledgebase' as const,
              href: `/dashboard/app/ai/knowledgebase/${kb.id}`,
              metadata: {
                files_count: kb.files_count,
                created_at: kb.created_at
              }
            })));
          }
        }
      } catch (error) {
        console.log('Could not search knowledge bases:', error);
      }

      setResults(searchResults);
      setTotalResults(searchResults.length);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <Bot className="h-5 w-5 text-blue-600" />;
      case 'conversation':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'knowledgebase':
        return <BookOpen className="h-5 w-5 text-purple-600" />;
      default:
        return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      agent: { label: 'AI Agent', variant: 'default' as const },
      conversation: { label: 'Conversation', variant: 'secondary' as const },
      knowledgebase: { label: 'Knowledge Base', variant: 'outline' as const }
    };
    
    const typeConfig = config[type as keyof typeof config] || { label: type, variant: 'outline' as const };
    
    return (
      <Badge variant={typeConfig.variant}>
        {typeConfig.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Search Results</h1>
              {totalResults > 0 && (
                <p className="text-muted-foreground">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                </p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search AI agents, conversations, knowledge bases..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Searching..." />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Link href={result.href}>
                    <div className="flex items-start gap-4 cursor-pointer">
                      <div className="p-2 rounded-lg bg-muted">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold hover:text-primary transition-colors">
                            {result.title}
                          </h3>
                          {getTypeBadge(result.type)}
                          {result.metadata?.is_active !== false && result.type === 'agent' && (
                            <Badge variant="default" className="bg-green-600 text-white">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {result.description}
                        </p>
                        {result.metadata?.created_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {new Date(result.metadata.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or search for different content.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter a search term to find AI agents, conversations, and knowledge bases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 