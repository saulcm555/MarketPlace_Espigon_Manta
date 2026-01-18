/**
 * Message Model
 * Representa un mensaje en una conversación
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    toolsUsed?: string[];
    extractedText?: string;
    filesAttached?: string[];
  };
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function createMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Message['metadata']
): Message {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date(),
    metadata
  };
}

export function createConversation(userId?: string): Conversation {
  return {
    id: generateId(),
    userId: userId || 'anonymous',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
