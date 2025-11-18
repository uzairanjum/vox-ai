// lib/training-api.ts
interface TrainingRequest {
  userId: string;
  fileId: string;
}

interface TrainingResponse {
  success: boolean;
  data?: {
    knowledgebaseId: string;
    trainingId: string;
    status: string;
    message?: string;
  };
  error?: string;
}

export async function trainAIWithFile(request: TrainingRequest): Promise<TrainingResponse> {
  try {
    const response = await fetch('http://localhost:8000/ai/conversation/training/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Training failed with status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Training API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}