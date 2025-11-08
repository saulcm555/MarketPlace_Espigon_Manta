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

export default router;
