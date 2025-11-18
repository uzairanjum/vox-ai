'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { toast } from 'sonner';
import { Bot, TestTube, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface TrainingDebugPanelProps {
  conversationId: string;
  locationId: string;
}

export function TrainingDebugPanel({ conversationId, locationId }: TrainingDebugPanelProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runTrainingTest = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      console.log('🧪 Starting training debug test...');
      
      const response = await fetch('/api/ai/conversation/test-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          locationId,
          testMode: 'simple'
        })
      });

      const results = await response.json();
      setTestResults(results);

      if (results.success) {
        toast.success('✅ Training test passed! FastAPI is working correctly.');
      } else {
        toast.error(`❌ Training test failed: ${results.error}`);
      }

      console.log('🧪 Training debug test results:', results);

    } catch (error) {
      console.error('Training debug test failed:', error);
      toast.error('Training debug test failed');
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/ai/health');
      const health = await response.json();
      
      console.log('Health check results:', health);
      
      if (health.success) {
        toast.success('✅ All services are online!');
      } else {
        toast.error('❌ Some services are offline');
      }
      
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Health check failed');
      return null;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TestTube className="w-4 h-4" />
          Training Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={runTrainingTest}
            disabled={isTesting}
            size="sm"
            className="w-full"
          >
            {isTesting ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Testing...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Test Training
              </>
            )}
          </Button>

          <Button
            onClick={checkHealth}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Check Health
          </Button>
        </div>

        {testResults && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Test Results:</h4>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {testResults.fastapi_connection ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs">FastAPI Connection</span>
                <Badge variant={testResults.fastapi_connection ? "default" : "destructive"} className="text-xs">
                  {testResults.fastapi_connection ? "Online" : "Offline"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {testResults.training_endpoint ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs">Training Endpoint</span>
                <Badge variant={testResults.training_endpoint ? "default" : "destructive"} className="text-xs">
                  {testResults.training_endpoint ? "Working" : "Failed"}
                </Badge>
              </div>
            </div>

            {testResults.error && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                Error: {testResults.error}
              </div>
            )}

            {testResults.details && (
              <details className="text-xs">
                <summary className="cursor-pointer">View Details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(testResults.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 