// utils/ghl/emailClient.ts
export interface EmailContent {
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string;
  direction: string;
  status: string;
}

export const loadEmailContent = async (emailId: string): Promise<EmailContent> => {
  const res = await fetch(`/api/email/${emailId}`);

  if (!res.ok) throw new Error("Failed to fetch email");
//   const data = await res.json();
  const data = await res.json();
  
  if (!data.success || !data.data?.emailMessage) {
    throw new Error("Invalid email response format");
  }

  const email = data.data.emailMessage;
  return {
    subject: email.subject || "",
    body: email.body || "[No content]",
    from: email.from || "",
    to: email.to || [],
    date: email.dateAdded || "",
    direction: email.direction || "",
    status: email.status || ""
  };
};
