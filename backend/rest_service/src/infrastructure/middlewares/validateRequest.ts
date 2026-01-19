import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware para validar requests usando express-validator
 * Captura errores de validación y retorna 400 con lista de errores
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log detallado para debugging
    console.error('❌ Validation errors:', JSON.stringify({
      url: req.url,
      method: req.method,
      params: req.params,
      body: req.body,
      errors: errors.array()
    }, null, 2));
    
    return res.status(400).json({
      status: 'error',
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
  }
  
  next();
};
