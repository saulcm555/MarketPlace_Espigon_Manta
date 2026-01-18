/**
 * ChatBot Widget Component
 * Widget flotante del asistente IA que aparece en toda la aplicación
 */

import { useState, useEffect, useRef } from 'react';
import { Bot, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendChatMessage } from '@/api/chat';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: Array<{ name: string; success: boolean }>;
  documentsProcessed?: Array<{ name: string; pages: number }>;
}

export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSend = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      documentsProcessed: files?.map(f => ({ name: f.name, pages: 0 }))
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(message, conversationId || undefined, files);

      if (response.success && response.data) {
        if (!conversationId) {
          setConversationId(response.data.conversationId);
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date(),
          toolsUsed: response.data.toolsUsed,
          documentsProcessed: response.data.documentsProcessed
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${response.error || 'No se pudo procesar tu mensaje.'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Error de conexión. Verifica que el servicio esté activo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante - solo visible cuando el chat está cerrado */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Abrir Asistente IA"
        >
          <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
          {/* Indicador de disponibilidad */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></span>
        </button>
      )}

      {/* Widget del Chat */}
      {isOpen && (
        <Card
          className={cn(
            'fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden',
            isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente IA</h3>
                <p className="text-xs text-primary-foreground/80">Espigón Manta</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={toggleChat}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contenido - solo visible cuando no está minimizado */}
          {!isMinimized && (
            <>
              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-base font-semibold mb-2">¡Hola! Soy tu asistente</h4>
                    <p className="text-sm text-muted-foreground">
                      Puedo ayudarte con productos, órdenes y pagos del marketplace.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        timestamp={message.timestamp}
                        toolsUsed={message.toolsUsed}
                        documentsProcessed={message.documentsProcessed}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground pl-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-xs">Pensando...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <ChatInput onSend={handleSend} disabled={isLoading} placeholder="Escribe tu mensaje..." />
            </>
          )}
        </Card>
      )}
    </>
  );
}
