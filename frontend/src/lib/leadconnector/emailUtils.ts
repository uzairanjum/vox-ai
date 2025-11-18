import { getCurrentUser } from '@/utils/supabase/supabaseUtils';

export interface EmailContent {
  body: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  headers?: Record<string, string>;
}

export async function loadEmailContent(messageId: string): Promise<EmailContent> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User is not authenticated");
    }

    const response = await fetch(
      `/api/leadconnector/emails/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${user.id}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load email: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || { body: "[No content]", subject: "", from: "", to: "", date: "" };
  } catch (error) {
    console.error('Error loading email content:', error);
    return { 
      body: "[Failed to load email content]", 
      subject: "", 
      from: "", 
      to: "", 
      date: "" 
    };
  }
}