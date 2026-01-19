/**
 * MCP Tools Index
 * 
 * Exporta todas las herramientas MCP disponibles.
 */

// Payment Tools
export { procesarPagoTool, procesarPago } from './procesar_pago';
export { consultarPagoTool } from './consultar_pago';

// Product Tools
export { buscarProductosTool, buscarProductos } from './buscar_productos';

// Order Tools
export { crearOrdenTool, crearOrden } from './crear_orden';

// Report Tools
export { resumenVentasTool, resumenVentas } from './resumen_ventas';

// Importar todos los tools
import { procesarPagoTool } from './procesar_pago';
import { consultarPagoTool } from './consultar_pago';
import { buscarProductosTool } from './buscar_productos';
import { crearOrdenTool } from './crear_orden';
import { resumenVentasTool } from './resumen_ventas';

// Lista de todos los tools disponibles (5 tools totales)
export const availableTools = [
  // Payment Service (2)
  procesarPagoTool,
  consultarPagoTool,
  // Rest Service - Productos (1)
  buscarProductosTool,
  // Rest Service - Órdenes (1)
  crearOrdenTool,
  // Report Service (1)
  resumenVentasTool,
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

