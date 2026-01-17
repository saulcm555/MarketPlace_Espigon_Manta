/**
 * MCP Tools Index
 * 
 * Exporta todas las herramientas MCP disponibles.
 */

export { procesarPagoTool, procesarPago } from './procesar_pago';
export { consultarPagoTool } from './consultar_pago';

// Lista de todos los tools disponibles
import { procesarPagoTool } from './procesar_pago';
import { consultarPagoTool } from './consultar_pago';

export const availableTools = [
  procesarPagoTool,
  consultarPagoTool,
  // Agregar más tools aquí
];

/**
 * Buscar un tool por nombre
 */
export function getToolByName(name: string) {
  return availableTools.find(tool => tool.name === name);
}

/**
 * Obtener lista de nombres de tools
 */
export function getToolNames(): string[] {
  return availableTools.map(tool => tool.name);
}
