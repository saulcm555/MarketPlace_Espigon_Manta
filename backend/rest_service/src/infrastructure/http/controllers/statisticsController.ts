import { Request, Response } from "express";
import AppDataSource from "../../../infrastructure/database/data-source";
import { SellerEntity } from "../../../models/sellerModel";
import { ProductEntity } from "../../../models/productModel";

/**
 * Obtener estadísticas generales del marketplace
 * @route GET /statistics
 * @access Public
 */
export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const sellerRepository = AppDataSource.getRepository(SellerEntity);
    const productRepository = AppDataSource.getRepository(ProductEntity);

    // Contar todos los vendedores registrados
    const totalSellers = await sellerRepository.count();

    // Contar todos los productos activos
    const totalProducts = await productRepository.count();

    res.status(200).json({
      success: true,
      data: {
        sellers: totalSellers,
        products: totalProducts,
        local: 100 // Valor fijo que representa 100% local
      }
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del marketplace"
    });
  }
};
