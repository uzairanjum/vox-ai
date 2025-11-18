// hooks/useTraining.ts
import { useState } from 'react';

interface TrainingState {
  isTraining: boolean;
  progress: number;
  status: 'idle' | 'training' | 'completed' | 'error';
  error?: string;
  knowledgebaseId?: string;
  jobId?: string;
}

interface TrainingResponse {
  success: boolean;
  data?: {
    jobId: string;
    knowledgebaseId: string;
    fileId: string;
    status: string;
    message: string;
  };
  error?: string;
}

async function trainAIWithFile(fileId: string): Promise<TrainingResponse> {
  const response = await fetch('/api/ai/training', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 401) {
      throw new Error('Please log in to start training');
    }
    if (response.status === 404) {
      throw new Error('File not found. Please upload the file first.');
    }
    
    const errorData = await response.json();
    throw new Error(errorData.error || `Training failed with status: ${response.status}`);
  }

  return response.json();
}

export function useTraining() {
  const [trainingState, setTrainingState] = useState<TrainingState>({
    isTraining: false,
    progress: 0,
    status: 'idle',
  });

  const startTraining = async (userId: string, fileId: string) => {
    setTrainingState({
      isTraining: true,
      progress: 0,
      status: 'training',
      error: undefined,
    });

    try {
      // Simulate progress updates (replace with real WebSocket if available)
      const progressInterval = setInterval(() => {
        setTrainingState(prev => ({
          ...prev,
          progress: prev.status === 'training' ? Math.min(prev.progress + 5, 95) : prev.progress,
        }));
      }, 2000);

      const result = await trainAIWithFile(fileId);

      clearInterval(progressInterval);

      if (result.success && result.data) {
        setTrainingState({
          isTraining: false,
          progress: 100,
          status: 'completed',
          knowledgebaseId: result.data.knowledgebaseId,
          jobId: result.data.jobId,
        });
        return result.data;
      } else {
        throw new Error(result.error || 'Training failed');
      }
    } catch (error) {
      setTrainingState({
        isTraining: false,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Training failed',
      });
      throw error;
    }
  };

  const resetTraining = () => {
    setTrainingState({
      isTraining: false,
      progress: 0,
      status: 'idle',
      error: undefined,
      knowledgebaseId: undefined,
      jobId: undefined,
    });
  };

  return {
    trainingState,
    startTraining,
    resetTraining,
  };
}