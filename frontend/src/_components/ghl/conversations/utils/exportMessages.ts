import { Message } from '../types';

interface ExportMessagesParams {
  conversationId: string;
  messages: Message[];
  lastMessageId: string;
}

interface FormattedMessage {
  id: string;
  body: string;
  direction: string;
  dateAdded: string;
  locationId: string;
  contactId: string;
}

export function exportOnlySmsg({ conversationId, messages, lastMessageId }: ExportMessagesParams) {
  // Filter messages that have body content
  const validMessages = messages.filter(msg =>
    msg.body &&
    msg.body.trim() !== '' &&
    msg.messageType === 'TYPE_SMS'
  );

  // Sort messages by date
  const sortedMessages = validMessages.sort((a, b) =>
    new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
  );

  // Format messages for RAG
  const formattedMessages = sortedMessages.map(msg => ({
    id: msg.id,
    body: msg.body.trim(),
    direction: msg.direction,
    dateAdded: msg.dateAdded,
    locationId: msg.locationId,
    contactId: msg.contactId
  }));

  // Get locationId from the first message (they all have the same locationId)
  const locationId = formattedMessages[0]?.locationId;

  if (!locationId) {
    throw new Error('No location ID found in messages');
  }

  return {
    conversationId,
    locationId,
    messages: formattedMessages,
    messageCount: formattedMessages.length,
    lastMessageId: lastMessageId || formattedMessages[formattedMessages.length - 1]?.id
  };
}


export function filterMessages(
  messages: Message[],
  excludeFields: string[] = [],
  getRole: (message: Message) => string
): Partial<Message>[] {
  return messages.map((message) => {
    // Shallow clone and remove excluded fields
    const cleanedMsg: Partial<Message> = { ...message };
    for (const field of excludeFields) {
      delete cleanedMsg[field as keyof Message];
    }

    // Add custom `role`
    cleanedMsg.role = getRole(message);

    return cleanedMsg;
  });
}


  // (msg) => msg.direction ? msg.direction === 'inbound' ? 'user' : 'ai' : 'system notification'

