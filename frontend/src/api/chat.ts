/**
 * Chat API Client
 * Cliente para comunicarse con el AI Orchestrator
 */

import { config } from '@/config/env';

const AI_ORCHESTRATOR_URL = config.aiOrchestratorUrl;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: Array<{ name: string; success: boolean }>;
  documentsProcessed?: Array<{ name: string; pages: number }>;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    conversationId: string;
    message: string;
    toolsUsed?: Array<{ name: string; success: boolean }>;
    documentsProcessed?: Array<{ name: string; pages: number }>;
  };
  error?: string;
}

export interface ChatHealthResponse {
  status: string;
  service: string;
  port: number;
  timestamp: string;
  dependencies: {
    mcp_service: string;
    gemini: string;
  };
}

/**
 * Enviar mensaje al chatbot
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string,
  files?: File[]
): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('message', message);
  
  if (conversationId) {
    formData.append('conversationId', conversationId);
  }
  
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file);
    });
  }

  const response = await fetch(`${AI_ORCHESTRATOR_URL}/api/chat/message`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
    return {
      success: false,
      error: errorData.error || `Error ${response.status}`
    };
  }

  return response.json();
}

/**
 * Verificar estado del AI Orchestrator
 */
export async function checkChatHealth(): Promise<ChatHealthResponse | null> {
  try {
    const response = await fetch(`${AI_ORCHESTRATOR_URL}/health`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Obtener herramientas disponibles
 */
export async function getChatTools(): Promise<string[]> {
  try {
    const response = await fetch(`${AI_ORCHESTRATOR_URL}/api/chat/tools`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.data?.tools?.map((t: { name: string }) => t.name) || [];
  } catch {
    return [];
  }
}
