import { Router, Request, Response } from 'express';
import AppDataSource from '../../database/data-source';
import { Coupon } from '../../../models/couponModel';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = Router();
const couponRepository = AppDataSource.getRepository(Coupon);

/**
 * POST /api/coupons/store
 * Endpoint interno para que Payment Service guarde cupones recibidos del Gym
 * Requiere token de servicio interno
 */
router.post('/store', async (req: Request, res: Response) => {
  try {
    // Validar token de servicio interno
    const serviceToken = req.headers['x-service-token'] as string;
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

    if (serviceToken !== expectedToken) {
      return res.status(401).json({ error: 'Token de servicio inválido' });
    }

    const {
      code,
      discount_percent,
      discount_type,
      valid_for,
      expires_at,
      issued_by,
      minimum_purchase,
      customer_email,
      customer_name,
      is_active,
      used
    } = req.body;

    // Validar datos requeridos
    if (!code || !customer_email) {
      return res.status(400).json({ 
        error: 'Datos requeridos faltantes',
        required: ['code', 'customer_email']
      });
    }

    // Verificar si el cupón ya existe
    const existingCoupon = await couponRepository.findOne({ where: { code } });
    if (existingCoupon) {
      return res.status(409).json({ 
        error: 'Cupón ya existe',
        coupon: existingCoupon 
      });
    }

    // Crear nuevo cupón
    const newCoupon = couponRepository.create({
      code,
      discount_percent: discount_percent || 15,
      discount_type: discount_type || 'percentage',
      valid_for: valid_for || 'marketplace_products',
      ...(expires_at && { expires_at: new Date(expires_at) }),
      issued_by: issued_by || 'Gym Management',
      minimum_purchase: minimum_purchase || 0,
      customer_email,
      customer_name,
      is_active: is_active !== undefined ? is_active : true,
      used: used !== undefined ? used : false
    });

    const savedCoupon = await couponRepository.save(newCoupon);

    console.log(`✅ Cupón guardado: ${code} para ${customer_email}`);

    res.status(201).json({
      message: 'Cupón guardado exitosamente',
      coupon: savedCoupon
    });
  } catch (error: any) {
    console.error('❌ Error al guardar cupón:', error);
    res.status(500).json({ 
      error: 'Error al guardar cupón',
      message: error.message 
    });
  }
});

/**
 * GET /api/coupons/my
 * Obtener cupones del usuario autenticado
 */
router.get('/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user?.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email de usuario no encontrado' });
    }

    // Obtener cupones activos del usuario
    const coupons = await couponRepository.find({
      where: {
        customer_email: userEmail,
        is_active: true
      },
      order: {
        created_at: 'DESC'
      }
    });

    // Filtrar cupones válidos (no expirados)
    const validCoupons = coupons.filter(coupon => coupon.isValid());

    res.json({
      coupons: validCoupons,
      total: validCoupons.length
    });
  } catch (error: any) {
    console.error('❌ Error al obtener cupones:', error);
    res.status(500).json({ 
      error: 'Error al obtener cupones',
      message: error.message 
    });
  }
});

/**
 * POST /api/coupons/validate
 * Validar un cupón antes de aplicarlo a una orden
 */
router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code, order_total } = req.body;
    const userEmail = (req as any).user?.email;

    if (!code || order_total === undefined) {
      return res.status(400).json({ 
        error: 'Datos requeridos faltantes',
        required: ['code', 'order_total']
      });
    }

    // Buscar cupón
    const coupon = await couponRepository.findOne({ 
      where: { 
        code,
        customer_email: userEmail 
      } 
    });

    if (!coupon) {
      return res.status(404).json({ 
        error: 'Cupón no encontrado o no pertenece al usuario',
        valid: false
      });
    }

    // Validar cupón
    if (!coupon.isValid()) {
      let reason = 'Cupón inválido';
      if (!coupon.is_active) reason = 'Cupón inactivo';
      if (coupon.used) reason = 'Cupón ya usado';
      if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
        reason = 'Cupón expirado';
      }

      return res.status(400).json({ 
        error: reason,
        valid: false
      });
    }

    // Validar monto mínimo
    if (!coupon.canApplyToOrder(order_total)) {
      return res.status(400).json({ 
        error: `Compra mínima requerida: $${coupon.minimum_purchase}`,
        valid: false,
        minimum_required: coupon.minimum_purchase
      });
    }

    // Calcular descuento
    const discount = coupon.calculateDiscount(order_total);
    const finalTotal = order_total - discount;

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        discount_type: coupon.discount_type,
        issued_by: coupon.issued_by,
        expires_at: coupon.expires_at
      },
      discount_amount: discount,
      original_total: order_total,
      final_total: finalTotal
    });
  } catch (error: any) {
    console.error('❌ Error al validar cupón:', error);
    res.status(500).json({ 
      error: 'Error al validar cupón',
      message: error.message 
    });
  }
});

/**
 * POST /api/coupons/apply
 * Aplicar cupón a una orden (marcar como usado)
 * Este endpoint se llama desde el proceso de crear orden
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const serviceToken = req.headers['x-service-token'] as string;
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

    if (serviceToken !== expectedToken) {
      return res.status(401).json({ error: 'Token de servicio inválido' });
    }

    const { code, order_id } = req.body;

    if (!code || !order_id) {
      return res.status(400).json({ 
        error: 'Datos requeridos faltantes',
        required: ['code', 'order_id']
      });
    }

    // Buscar cupón
    const coupon = await couponRepository.findOne({ where: { code } });

    if (!coupon) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    // Marcar como usado
    coupon.used = true;
    coupon.used_at = new Date();
    coupon.order_id = order_id;

    await couponRepository.save(coupon);

    console.log(`✅ Cupón ${code} aplicado a orden #${order_id}`);

    res.json({
      message: 'Cupón aplicado exitosamente',
      coupon_code: code,
      order_id
    });
  } catch (error: any) {
    console.error('❌ Error al aplicar cupón:', error);
    res.status(500).json({ 
      error: 'Error al aplicar cupón',
      message: error.message 
    });
  }
});

export default router;
