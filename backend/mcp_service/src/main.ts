/**
 * MCP Service - Main Entry Point
 * Pilar 3: Chatbot Multimodal con IA
 * 
 * Estructura mínima para el cliente de Payment Service.
 * Expandir con AI Orchestrator y demás componentes.
 */

import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import { getPaymentClient } from './clients/PaymentClient';
import { availableTools, getToolByName } from './tools';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const paymentClient = getPaymentClient();
  const paymentHealth = await paymentClient.health();

  res.json({
    status: 'ok',
    service: 'mcp-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dependencies: {
      'payment-service': paymentHealth.status
    }
  });
});

// Listar tools disponibles
app.get('/tools', (req: Request, res: Response) => {
  res.json({
    tools: availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))
  });
});

// Ejecutar un tool
app.post('/tools/:name/execute', async (req: Request, res: Response) => {
  const { name } = req.params;
  const params = req.body;

  const tool = getToolByName(name);

  if (!tool) {
    return res.status(404).json({ error: `Tool '${name}' no encontrado` });
  }

  try {
    const result = await tool.execute(params);
    const formatted = tool.formatResponse ? tool.formatResponse(result as any) : null;

    res.json({
      tool: name,
      result,
      formatted
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error al ejecutar tool',
      message: error.message
    });
  }
});

// Root
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: '🤖 MCP Service - Marketplace Espigón Manta',
    version: '1.0.0',
    pilar: 'Pilar 3: Chatbot Multimodal con IA',
    endpoints: {
      health: 'GET /health',
      tools: 'GET /tools',
      execute: 'POST /tools/:name/execute'
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🤖 MCP SERVICE                                         ║
║   Marketplace Espigón Manta                              ║
║                                                          ║
║   🎯 Pilar 3: Chatbot Multimodal con IA                 ║
║                                                          ║
║   🌐 Puerto: ${PORT}                                         ║
║                                                          ║
║   📋 Tools disponibles:                                  ║
║   • procesar_pago                                        ║
║   • consultar_pago                                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
