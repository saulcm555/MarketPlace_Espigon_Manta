/**
 * PDF Processor
 * Extrae texto de documentos PDF usando pdf-parse
 * Solo soporte para PDF (sin OCR, sin imágenes según el documento)
 */

import pdf from 'pdf-parse';
import { ProcessedDocument } from '../adapters/LLMAdapter';

export interface ProcessingResult {
  success: boolean;
  document?: ProcessedDocument;
  error?: string;
}

export class PDFProcessor {
  private maxFileSizeMB: number;

  constructor(maxFileSizeMB: number = 10) {
    this.maxFileSizeMB = maxFileSizeMB;
  }

  /**
   * Procesar un buffer de archivo PDF
   */
  async processBuffer(buffer: Buffer, filename: string): Promise<ProcessingResult> {
    try {
      // Verificar tamaño
      const fileSizeMB = buffer.length / (1024 * 1024);
      if (fileSizeMB > this.maxFileSizeMB) {
        return {
          success: false,
          error: `El archivo excede el tamaño máximo permitido (${this.maxFileSizeMB}MB)`
        };
      }

      // Verificar que es un PDF (magic bytes)
      if (!this.isPDF(buffer)) {
        return {
          success: false,
          error: 'El archivo no es un PDF válido'
        };
      }

      // Extraer texto
      const data = await pdf(buffer);

      const processedDoc: ProcessedDocument = {
        name: filename,
        extractedText: this.cleanText(data.text),
        pageCount: data.numpages,
        metadata: {
          info: data.info,
          version: data.version
        }
      };

      console.log(`[PDFProcessor] Procesado: ${filename} - ${data.numpages} páginas`);

      return {
        success: true,
        document: processedDoc
      };
    } catch (error: any) {
      console.error('[PDFProcessor] Error procesando PDF:', error);
      return {
        success: false,
        error: `Error procesando PDF: ${error.message}`
      };
    }
  }

  /**
   * Procesar múltiples archivos PDF
   */
  async processMultiple(
    files: Array<{ buffer: Buffer; filename: string }>
  ): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];

    for (const file of files) {
      const result = await this.processBuffer(file.buffer, file.filename);
      if (result.success && result.document) {
        results.push(result.document);
      } else {
        console.warn(`[PDFProcessor] No se pudo procesar: ${file.filename} - ${result.error}`);
      }
    }

    return results;
  }

  /**
   * Verificar si el buffer es un PDF válido (magic bytes)
   */
  private isPDF(buffer: Buffer): boolean {
    if (buffer.length < 5) return false;
    // Los PDFs empiezan con %PDF-
    const header = buffer.slice(0, 5).toString('ascii');
    return header === '%PDF-';
  }

  /**
   * Limpiar texto extraído
   */
  private cleanText(text: string): string {
    return text
      // Remover múltiples espacios
      .replace(/\s+/g, ' ')
      // Remover múltiples líneas vacías
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Obtener extensiones soportadas
   */
  getSupportedExtensions(): string[] {
    return ['.pdf'];
  }

  /**
   * Verificar si un archivo es soportado por extensión
   */
  isSupported(filename: string): boolean {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return this.getSupportedExtensions().includes(ext);
  }
}

// Singleton
let pdfProcessorInstance: PDFProcessor | null = null;

export function getPDFProcessor(): PDFProcessor {
  if (!pdfProcessorInstance) {
    pdfProcessorInstance = new PDFProcessor();
  }
  return pdfProcessorInstance;
}
