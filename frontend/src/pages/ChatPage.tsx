/**
 * Chat Page
 * Página principal del chatbot con IA
 */

import { useState, useEffect, useRef } from 'react';
import { Bot, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatMessage, MessageProps } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendChatMessage, checkChatHealth, ChatHealthResponse } from '@/api/chat';
import { cn } from '@/lib/utils';

interface Message extends MessageProps {
  id: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<ChatHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verificar salud del servicio al cargar
  useEffect(() => {
    checkHealth();
  }, []);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    const result = await checkChatHealth();
    setHealth(result);
    setIsCheckingHealth(false);
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

    // Mostrar indicador de carga
    setIsLoading(true);

    try {
      const response = await sendChatMessage(message, conversationId || undefined, files);

      if (response.success && response.data) {
        // Guardar conversationId para contexto
        if (!conversationId) {
          setConversationId(response.data.conversationId);
        }

        // Agregar respuesta del asistente
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
        // Error en la respuesta
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${response.error || 'No se pudo procesar tu mensaje. Intenta de nuevo.'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Error de conexión
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Error de conexión. Verifica que el servicio de IA esté activo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const isServiceHealthy = health?.status === 'ok';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Asistente IA</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Estado del servicio */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                isCheckingHealth
                  ? 'bg-muted text-muted-foreground'
                  : isServiceHealthy
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {isCheckingHealth ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : isServiceHealthy ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{isCheckingHealth ? 'Verificando...' : isServiceHealthy ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleNewConversation}>
              Nueva conversación
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto py-4">
        <Card className="h-[calc(100vh-8rem)] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat con el Marketplace
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Alerta si el servicio está caído */}
              {!isCheckingHealth && !isServiceHealthy && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El servicio de IA no está disponible. 
                    <Button variant="link" className="p-0 h-auto ml-1" onClick={checkHealth}>
                      Reintentar conexión
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Mensaje de bienvenida */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">¡Hola! Soy tu asistente del Marketplace</h2>
                  <p className="text-muted-foreground max-w-md">
                    Puedo ayudarte a buscar productos, crear órdenes, consultar pagos y mucho más.
                    Escribe tu pregunta o adjunta un PDF para comenzar.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend('¿Qué productos tienen disponibles?')}
                      disabled={!isServiceHealthy || isLoading}
                    >
                      🛒 Ver productos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend('Busca productos que cuesten menos de $20')}
                      disabled={!isServiceHealthy || isLoading}
                    >
                      💰 Productos económicos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend('¿Cuáles son los mejores vendedores?')}
                      disabled={!isServiceHealthy || isLoading}
                    >
                      🏆 Top vendedores
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de mensajes */}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}

              {/* Indicador de carga */}
              {isLoading && (
                <ChatMessage
                  role="assistant"
                  content=""
                  isLoading
                />
              )}

              {/* Ref para auto-scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput
              onSend={handleSend}
              disabled={!isServiceHealthy || isLoading}
              placeholder={
                !isServiceHealthy
                  ? 'Servicio no disponible...'
                  : isLoading
                  ? 'Esperando respuesta...'
                  : 'Escribe tu mensaje...'
              }
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
