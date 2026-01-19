/**
 * Chat Message Component
 * Renderiza un mensaje individual del chat
 */

import { Bot, User, Wrench, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  toolsUsed?: Array<{ name: string; success: boolean }>;
  documentsProcessed?: Array<{ name: string; pages: number }>;
  isLoading?: boolean;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  toolsUsed,
  documentsProcessed,
  isLoading
}: MessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {isUser ? 'Tú' : 'Asistente IA'}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Message Content */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">Escribiendo...</span>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        )}

        {/* Tools Used */}
        {toolsUsed && toolsUsed.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {toolsUsed.map((tool, index) => (
              <span
                key={index}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  tool.success
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                <Wrench className="w-3 h-3" />
                {tool.name}
              </span>
            ))}
          </div>
        )}

        {/* Documents Processed */}
        {documentsProcessed && documentsProcessed.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {documentsProcessed.map((doc, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <FileText className="w-3 h-3" />
                {doc.name} ({doc.pages} págs.)
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
