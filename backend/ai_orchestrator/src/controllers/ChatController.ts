/**
 * Chat Controller
 * Maneja el endpoint POST /api/chat/message con FormData
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getLLMService, LLMService } from '../services/LLMService';
import { getPDFProcessor, PDFProcessor } from '../processors/PDFProcessor';
import { ProcessedDocument } from '../adapters/LLMAdapter';

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Máximo 5 archivos
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar PDFs
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos PDF'));
    }
  }
});

export class ChatController {
  private llmService: LLMService;
  private pdfProcessor: PDFProcessor;
  public router: Router;

  constructor() {
    this.llmService = getLLMService();
    this.pdfProcessor = getPDFProcessor();
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * POST /api/chat/message
     * Endpoint unificado que acepta FormData con:
     * - message: string (requerido)
     * - conversationId: string (opcional)
     * - files: PDF files (opcional)
     */
    this.router.post(
      '/message',
      upload.array('files', 5),
      this.handleMessage.bind(this)
    );

    /**
     * GET /api/chat/conversation/:id
     * Obtener historial de conversación
     */
    this.router.get(
      '/conversation/:id',
      this.getConversation.bind(this)
    );

    /**
     * DELETE /api/chat/conversation/:id
     * Eliminar conversación
     */
    this.router.delete(
      '/conversation/:id',
      this.deleteConversation.bind(this)
    );

    /**
     * GET /api/chat/tools
     * Listar herramientas disponibles
     */
    this.router.get(
      '/tools',
      this.getTools.bind(this)
    );
  }

  /**
   * Manejar mensaje del usuario
   */
  private async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversationId } = req.body;

      // Validar mensaje
      if (!message || typeof message !== 'string' || message.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'El campo "message" es requerido'
        });
        return;
      }

      // Procesar archivos PDF si existen
      let documents: ProcessedDocument[] = [];
      const files = req.files as Express.Multer.File[];

      if (files && files.length > 0) {
        console.log(`[ChatController] Procesando ${files.length} archivo(s)`);
        
        const fileData = files.map(f => ({
          buffer: f.buffer,
          filename: f.originalname
        }));

        documents = await this.pdfProcessor.processMultiple(fileData);
        console.log(`[ChatController] Documentos procesados: ${documents.length}`);
      }

      // Llamar al LLM Service
      const response = await this.llmService.chat({
        message: message.trim(),
        conversationId,
        documents: documents.length > 0 ? documents : undefined
      });

      res.json({
        success: true,
        data: {
          conversationId: response.conversationId,
          message: response.message,
          toolsUsed: response.toolsUsed,
          documentsProcessed: documents.length > 0 
            ? documents.map(d => ({ name: d.name, pages: d.pageCount }))
            : undefined
        }
      });
    } catch (error: any) {
      console.error('[ChatController] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error procesando mensaje'
      });
    }
  }

  /**
   * Obtener conversación por ID
   */
  private getConversation(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const conversation = this.llmService.getConversation(id);

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: conversation.id,
          messageCount: conversation.messages.length,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messages: conversation.messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Eliminar conversación
   */
  private deleteConversation(req: Request, res: Response): void {
    try {
      const { id } = req.params;
      const deleted = this.llmService.deleteConversation(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Conversación eliminada'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Listar tools disponibles
   */
  private getTools(req: Request, res: Response): void {
    try {
      const tools = this.llmService.getAvailableTools();
      res.json({
        success: true,
        data: {
          count: tools.length,
          tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export function createChatController(): ChatController {
  return new ChatController();
}
