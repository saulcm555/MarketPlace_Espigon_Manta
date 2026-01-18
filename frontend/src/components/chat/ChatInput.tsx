/**
 * Chat Input Component
 * Input para escribir mensajes y adjuntar PDFs
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim() && files.length === 0) return;
    onSend(message.trim(), files.length > 0 ? files : undefined);
    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(
      file => file.type === 'application/pdf'
    );
    
    if (pdfFiles.length !== selectedFiles.length) {
      alert('Solo se permiten archivos PDF');
    }
    
    setFiles(prev => [...prev, ...pdfFiles].slice(0, 5)); // Máximo 5 archivos
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-background p-4">
      {/* Archivos adjuntos */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
            >
              <FileText className="w-4 h-4 text-red-500" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input y botones */}
      <div className="flex items-end gap-2">
        {/* Botón adjuntar */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= 5}
          className="flex-shrink-0"
          title="Adjuntar PDF"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)'}
          disabled={disabled}
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none',
            disabled && 'opacity-50'
          )}
          rows={1}
        />

        {/* Botón enviar */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && files.length === 0)}
          size="icon"
          className="flex-shrink-0"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground mt-2">
        Puedes adjuntar hasta 5 archivos PDF. El asistente puede buscar productos, crear órdenes y consultar pagos.
      </p>
    </div>
  );
}
