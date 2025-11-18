'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database,
  Bug,
  Shield,
  RefreshCw,
  FileText,
  Users,
  Brain,
  Zap,
  Bot,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticData {
  agents: {
    total: number;
    withValidTypes: number;
    invalidEntries: any[];
  };
  knowledgeBases: {
    total: number;
    withValidTypes: number;
    invalidEntries: any[];
  };
  potentialIssues: string[];
  recommendations: string[];
}

export default function DataIntegrityPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isCleaningAgents, setIsCleaningAgents] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [fixProgress, setFixProgress] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runDiagnostic = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/debug/data-integrity');
      const data = await response.json();
      
      if (data.success) {
        setDiagnostic(data.data);
        setLastCheck(new Date());
        toast.success('Diagnostic completed successfully');
      } else {
        toast.error('Failed to run diagnostic: ' + data.error);
      }
    } catch (error) {
      console.error('Error running diagnostic:', error);
      toast.error('Failed to run diagnostic');
    } finally {
      setIsChecking(false);
    }
  };

  const autoFixIssues = async () => {
    setIsFixing(true);
    setFixProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFixProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/debug/fix-data', {
        method: 'POST',
      });
      const data = await response.json();
      
      clearInterval(progressInterval);
      setFixProgress(100);
      
      if (data.success) {
        toast.success('Data integrity issues fixed successfully');
      } else {
        toast.error('Failed to fix issues: ' + data.error);
      }
      
      // Wait a bit to show complete progress
      setTimeout(async () => {
        await runDiagnostic();
        setFixProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error running auto-fix:', error);
      toast.error('Failed to run auto-fix');
      setFixProgress(0);
    } finally {
      setIsFixing(false);
    }
  };

  const hasIssues = diagnostic && (
    diagnostic.agents.invalidEntries.length > 0 ||
    diagnostic.knowledgeBases.invalidEntries.length > 0 ||
    diagnostic.potentialIssues.length > 0
  );

  const getStatusColor = (hasIssues: boolean) => {
    return hasIssues ? 'text-red-600' : 'text-green-600';
  };

  const getStatusIcon = (hasIssues: boolean) => {
    return hasIssues ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />;
  };

  const cleanupDefaultAgents = async () => {
    if (!confirm('This will delete all default agents (Default Response Agent, Default Query Agent, etc.). Are you sure?')) {
      return;
    }

    setIsCleaningAgents(true);
    try {
      const response = await fetch('/api/debug/fix-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_default_agents' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully deleted ${data.deletedAgents?.length || 0} default agents`);
        if (data.deletedAgents?.length > 0) {
          console.log('Deleted agents:', data.deletedAgents);
        }
      } else {
        toast.error(data.error || 'Failed to cleanup default agents');
      }
    } catch (error) {
      console.error('Error cleaning up default agents:', error);
      toast.error('Failed to cleanup default agents');
    } finally {
      setIsCleaningAgents(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Integrity Center</h1>
            <p className="text-gray-600">
              Monitor and maintain data consistency across your AI systems
            </p>
          </div>
        </div>
        
        {lastCheck && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Last checked: {lastCheck.toLocaleString()}
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Bug className="w-5 h-5" />
              System Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              Perform a comprehensive scan of your database for integrity issues, 
              misplaced records, and data inconsistencies.
            </p>
            <Button 
              onClick={runDiagnostic} 
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning Database...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Run Full Diagnostic
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {diagnostic && hasIssues && (
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Zap className="w-5 h-5" />
                Auto-Repair
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-4">
                Automatically fix identified issues by moving misplaced data 
                and correcting type conflicts.
              </p>
              <Button 
                onClick={autoFixIssues} 
                disabled={isFixing} 
                variant="outline"
                className="w-full border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Repairing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-Fix All Issues
                  </>
                )}
              </Button>
              {isFixing && (
                <div className="mt-3">
                  <Progress value={fixProgress} className="w-full h-2" />
                  <p className="text-xs text-green-600 mt-1">
                    Progress: {fixProgress}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Bot className="w-5 h-5" />
              Cleanup Default Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-4">
              Delete automatically created default agents that may be causing conflicts.
              <br />
              <strong>Warning:</strong> This will remove Default Response Agent, Default Query Agent, etc.
            </p>
            <Button 
              onClick={cleanupDefaultAgents} 
              disabled={isCleaningAgents} 
              variant="outline"
              className="w-full border-red-600 text-red-700 hover:bg-red-600 hover:text-white"
            >
              {isCleaningAgents ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cleaning Up...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Delete Default Agents
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <FileText className="w-5 h-5" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700 mb-4">
              Learn about data integrity best practices and understanding 
              common issues in AI agent systems.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Documentation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {diagnostic && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues Details</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {hasIssues ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  System Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasIssues ? (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-green-700 mb-2">
                        System Healthy! 🎉
                      </h3>
                      <p className="text-gray-600 text-lg">
                        No data integrity issues detected in your database.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <Brain className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">{diagnostic.agents.total}</div>
                        <div className="text-sm text-green-600">AI Agents</div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700">{diagnostic.knowledgeBases.total}</div>
                        <div className="text-sm text-blue-600">Knowledge Bases</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-700">0</div>
                        <div className="text-sm text-gray-600">Issues Found</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">100%</div>
                        <div className="text-sm text-green-600">Data Integrity</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        <strong>Data integrity issues detected!</strong> 
                        Issues found that may affect your AI system's performance.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700">{diagnostic.agents.total}</div>
                        <div className="text-sm text-blue-600">AI Agents</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">{diagnostic.knowledgeBases.total}</div>
                        <div className="text-sm text-green-600">Knowledge Bases</div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-700">
                          {diagnostic.agents.invalidEntries.length + diagnostic.knowledgeBases.invalidEntries.length}
                        </div>
                        <div className="text-sm text-red-600">Invalid Entries</div>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <XCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-700">{diagnostic.potentialIssues.length}</div>
                        <div className="text-sm text-yellow-600">Potential Issues</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {hasIssues ? (
              <div className="space-y-4">
                {/* Invalid Agents */}
                {diagnostic.agents.invalidEntries.length > 0 && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <Bot className="w-5 h-5" />
                        Invalid AI Agents ({diagnostic.agents.invalidEntries.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {diagnostic.agents.invalidEntries.map((agent, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{agent.name}</h4>
                              <Badge variant="destructive">Invalid</Badge>
                            </div>
                            <p className="text-sm text-red-700">
                              ID: {agent.id} | Type: {agent.type}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Invalid Knowledge Bases */}
                {diagnostic.knowledgeBases.invalidEntries.length > 0 && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <Database className="w-5 h-5" />
                        Invalid Knowledge Bases ({diagnostic.knowledgeBases.invalidEntries.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {diagnostic.knowledgeBases.invalidEntries.map((kb, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{kb.name}</h4>
                              <Badge variant="destructive">Invalid</Badge>
                            </div>
                            <p className="text-sm text-red-700">
                              ID: {kb.id} | Type: {kb.type}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Potential Issues */}
                {diagnostic.potentialIssues.length > 0 && (
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="w-5 h-5" />
                        Potential Issues ({diagnostic.potentialIssues.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {diagnostic.potentialIssues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2 text-yellow-700">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {diagnostic.recommendations.length > 0 && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <CheckCircle className="w-5 h-5" />
                        Recommendations ({diagnostic.recommendations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {diagnostic.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-blue-700">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">
                  No Issues Found
                </h3>
                <p className="text-gray-600">
                  Your database is clean and all data is properly organized.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    AI Agents Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Agents</span>
                      <span className="font-semibold">{diagnostic.agents.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valid Types</span>
                      <span className="font-semibold text-green-600">{diagnostic.agents.withValidTypes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Invalid Entries</span>
                      <span className="font-semibold text-red-600">{diagnostic.agents.invalidEntries.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(diagnostic.agents.withValidTypes / diagnostic.agents.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round((diagnostic.agents.withValidTypes / diagnostic.agents.total) * 100)}% valid
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    Knowledge Bases Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Knowledge Bases</span>
                      <span className="font-semibold">{diagnostic.knowledgeBases.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valid Types</span>
                      <span className="font-semibold text-green-600">{diagnostic.knowledgeBases.withValidTypes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Invalid Entries</span>
                      <span className="font-semibold text-red-600">{diagnostic.knowledgeBases.invalidEntries.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(diagnostic.knowledgeBases.withValidTypes / diagnostic.knowledgeBases.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round((diagnostic.knowledgeBases.withValidTypes / diagnostic.knowledgeBases.total) * 100)}% valid
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 