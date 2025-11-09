import { Router, Request, Response } from "express";
import { upload } from "../../middlewares/upload";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";
import { uploadToSupabase } from "../../storage/supabaseStorage";
import * as fs from "fs";
import * as path from "path";

const router = Router();

/**
 * POST /api/upload/product-image
 * Subir imagen de producto
 * Requiere autenticación como seller
 * Sube a Supabase si está configurado, sino guarda localmente
 */
router.post(
  "/product-image",
  authMiddleware,
  roleMiddleware("seller"),
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          message: "No se recibió ningún archivo" 
        });
      }

      let imageUrl = "";
      const fileName = req.file.filename;

      // Intentar subir a Supabase
      const supabaseUrl = await uploadToSupabase(
        req.file.buffer || fs.readFileSync(req.file.path),
        fileName,
        'products'
      );

      if (supabaseUrl) {
        // Si se subió a Supabase exitosamente
        imageUrl = supabaseUrl;
        console.log("✅ Imagen subida a Supabase:", imageUrl);

        // Eliminar archivo local si existe
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } else {
        // Si falla Supabase, usar almacenamiento local
        imageUrl = `/uploads/products/${fileName}`;
        console.log("⚠️  Usando almacenamiento local:", imageUrl);
      }

      res.status(200).json({
        message: "Imagen subida exitosamente",
        imageUrl: imageUrl,
        filename: fileName,
        storage: supabaseUrl ? 'supabase' : 'local'
      });
    } catch (error: any) {
      console.error("Error al subir imagen:", error);
      res.status(500).json({ 
        message: "Error al subir la imagen",
        error: error.message 
      });
    }
  }
);

/**
 * POST /api/upload/payment-receipt
 * Subir comprobante de pago (transferencia bancaria)
 * Requiere autenticación (cliente o seller)
 * Sube a Supabase Storage bucket 'payment-receipts'
 */
router.post(
  "/payment-receipt",
  authMiddleware,
  upload.single('receipt'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          message: "No se recibió ningún comprobante" 
        });
      }

      // Validar que sea una imagen
      const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Formato de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP) o PDF"
        });
      }

      // Validar tamaño máximo (5 MB)
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          message: "El archivo es demasiado grande. Máximo 5 MB"
        });
      }

      const orderId = req.body.order_id || 'temp';
      const timestamp = Date.now();
      const extension = path.extname(req.file.originalname);
      const fileName = `orders/${orderId}/receipt-${timestamp}${extension}`;

      // Intentar subir a Supabase
      const supabaseUrl = await uploadToSupabase(
        req.file.buffer || fs.readFileSync(req.file.path),
        fileName,
        'payment-receipts'
      );

      if (supabaseUrl) {
        console.log("✅ Comprobante subido a Supabase:", supabaseUrl);

        // Eliminar archivo local si existe
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
          message: "Comprobante subido exitosamente",
          receiptUrl: supabaseUrl,
          filename: fileName,
          storage: 'supabase'
        });
      } else {
        // Si falla Supabase, retornar error (no guardamos comprobantes localmente)
        res.status(500).json({
          message: "Error al subir el comprobante. Supabase no está configurado correctamente.",
          error: "Supabase Storage no disponible"
        });
      }
    } catch (error: any) {
      console.error("Error al subir comprobante:", error);
      res.status(500).json({ 
        message: "Error al subir el comprobante",
        error: error.message 
      });
    }
  }
);

export default router;
