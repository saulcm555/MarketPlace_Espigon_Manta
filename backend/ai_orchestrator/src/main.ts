/**
 * AI Orchestrator - Main Entry Point
 * Puerto: 3004
 * 
 * Este servicio es el "cerebro" del chatbot multimodal.
 * Toma decisiones de IA usando Gemini y ejecuta herramientas via MCP Service.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { createChatController } from './controllers/ChatController';
import { getLLMService } from './services/LLMService';
import { getMCPClient } from './services/MCPClient';

const app = express();

// Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const mcpClient = getMCPClient();
  const mcpHealthy = await mcpClient.healthCheck();

  res.json({
    status: 'ok',
    service: 'ai-orchestrator',
    port: env.PORT,
    timestamp: new Date().toISOString(),
    dependencies: {
      mcp_service: mcpHealthy ? 'healthy' : 'unhealthy',
      gemini: 'configured'
    }
  });
});

// Info endpoint
app.get('/info', (req: Request, res: Response) => {
  const llmService = getLLMService();
  const tools = llmService.getAvailableTools();

  res.json({
    service: 'AI Orchestrator',
    version: '1.0.0',
    description: 'Cerebro del chatbot multimodal del Marketplace Espigón Manta',
    capabilities: {
      textChat: true,
      pdfProcessing: true,
      functionCalling: true
    },
    availableTools: tools.map(t => t.name),
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      chat: 'POST /api/chat/message',
      tools: 'GET /api/chat/tools',
      conversation: 'GET /api/chat/conversation/:id',
      deleteConversation: 'DELETE /api/chat/conversation/:id'
    }
  });
});

// Chat routes
const chatController = createChatController();
app.use('/api/chat', chatController.router);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.message);
  
  // Error de multer (archivos)
  if (err.message.includes('Solo se aceptan archivos PDF')) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.path}`
  });
});

// Iniciar servidor
async function startServer(): Promise<void> {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('        AI ORCHESTRATOR - Iniciando');
    console.log('═══════════════════════════════════════════');

    // Inicializar LLM Service (carga tools del MCP)
    const llmService = getLLMService();
    await llmService.initialize();

    // Configurar limpieza periódica de conversaciones
    setInterval(() => {
      llmService.cleanupOldConversations();
    }, 15 * 60 * 1000); // Cada 15 minutos

    // Iniciar servidor HTTP
    app.listen(env.PORT, () => {
      console.log('═══════════════════════════════════════════');
      console.log(`  🤖 AI Orchestrator iniciado`);
      console.log(`  📍 Puerto: ${env.PORT}`);
      console.log(`  🔗 MCP Service: ${env.MCP_SERVICE_URL}`);
      console.log(`  🧠 Modelo: ${env.GEMINI_MODEL}`);
      console.log('═══════════════════════════════════════════');
      console.log('  Endpoints disponibles:');
      console.log('  - GET  /health');
      console.log('  - GET  /info');
      console.log('  - POST /api/chat/message');
      console.log('  - GET  /api/chat/tools');
      console.log('  - GET  /api/chat/conversation/:id');
      console.log('  - DELETE /api/chat/conversation/:id');
      console.log('═══════════════════════════════════════════');
    });
  } catch (error: any) {
    console.error('Error iniciando AI Orchestrator:', error.message);
    process.exit(1);
  }
}

startServer();
