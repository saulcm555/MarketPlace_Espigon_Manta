import { Router, Request, Response } from "express";
import { upload } from "../../middlewares/upload";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { roleMiddleware } from "../../middlewares/roleMiddleware";

const router = Router();

/**
 * POST /api/upload/product-image
 * Subir imagen de producto
 * Requiere autenticación como seller
 */
router.post(
  "/product-image",
  authMiddleware,
  roleMiddleware("seller"),
  upload.single('image'),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          message: "No se recibió ningún archivo" 
        });
      }

      // Construir URL de la imagen
      const imageUrl = `/uploads/products/${req.file.filename}`;

      res.status(200).json({
        message: "Imagen subida exitosamente",
        imageUrl: imageUrl,
        filename: req.file.filename
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
