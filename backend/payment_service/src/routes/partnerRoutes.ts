/**
 * Partner Routes
 * Endpoints para gestionar partners B2B
 */

import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { WebhookSecurity } from '../utils/webhookSecurity';

const router = Router();

/**
 * POST /api/partners/register
 * Registrar un nuevo partner
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, webhook_url, events } = req.body;

    // Validaciones
    if (!name || !webhook_url || !events || !Array.isArray(events)) {
      return res.status(400).json({ 
        error: 'Datos inválidos',
        required: { name: 'string', webhook_url: 'string', events: 'array' }
      });
    }

    if (events.length === 0) {
      return res.status(400).json({ error: 'Debe suscribirse al menos a un evento' });
    }

    // Generar secret compartido
    const secret = WebhookSecurity.generateSecret(32);

    // Guardar en BD
    const result = await query(
      `INSERT INTO partners (name, webhook_url, events, secret) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_partner, name, webhook_url, events, secret, created_at`,
      [name, webhook_url, events, secret]
    );

    const partner = result.rows[0];

    console.log(`✅ [PartnerRoutes] Nuevo partner registrado: ${partner.name}`);

    res.status(201).json({
      success: true,
      partner: {
        id: partner.id_partner,
        name: partner.name,
        webhook_url: partner.webhook_url,
        events: partner.events,
        secret: partner.secret, // ⚠️ Solo se muestra una vez
        created_at: partner.created_at
      },
      warning: '⚠️ Guarda el secret en un lugar seguro. No se mostrará de nuevo.'
    });
  } catch (error: any) {
    console.error('❌ [PartnerRoutes] Error al registrar partner:', error);
    res.status(500).json({ 
      error: 'Error al registrar partner',
      message: error.message 
    });
  }
});

/**
 * GET /api/partners
 * Listar todos los partners activos
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id_partner, name, webhook_url, events, active, created_at FROM partners WHERE active = true'
    );

    res.json({
      partners: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('❌ [PartnerRoutes] Error al listar partners:', error);
    res.status(500).json({ 
      error: 'Error al listar partners',
      message: error.message 
    });
  }
});

/**
 * GET /api/partners/:id
 * Obtener información de un partner específico
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id_partner, name, webhook_url, events, active, created_at FROM partners WHERE id_partner = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ [PartnerRoutes] Error al obtener partner:', error);
    res.status(500).json({ 
      error: 'Error al obtener partner',
      message: error.message 
    });
  }
});

/**
 * PUT /api/partners/:id
 * Actualizar eventos de un partner
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { events, webhook_url } = req.body;

    if (!events && !webhook_url) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (events) {
      updates.push(`events = $${paramIndex++}`);
      values.push(events);
    }

    if (webhook_url) {
      updates.push(`webhook_url = $${paramIndex++}`);
      values.push(webhook_url);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE partners SET ${updates.join(', ')} WHERE id_partner = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    console.log(`🔄 [PartnerRoutes] Partner actualizado: ${result.rows[0].name}`);

    res.json({
      success: true,
      partner: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ [PartnerRoutes] Error al actualizar partner:', error);
    res.status(500).json({ 
      error: 'Error al actualizar partner',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/partners/:id
 * Desactivar un partner (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE partners SET active = false WHERE id_partner = $1 RETURNING name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    console.log(`🗑️ [PartnerRoutes] Partner desactivado: ${result.rows[0].name}`);

    res.json({
      success: true,
      message: `Partner ${result.rows[0].name} desactivado`
    });
  } catch (error: any) {
    console.error('❌ [PartnerRoutes] Error al desactivar partner:', error);
    res.status(500).json({ 
      error: 'Error al desactivar partner',
      message: error.message 
    });
  }
});

export default router;
