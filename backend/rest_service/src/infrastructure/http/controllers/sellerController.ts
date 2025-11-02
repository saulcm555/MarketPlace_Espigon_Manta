import { Request, Response } from "express";
import { RegisterSeller } from "../../../application/use_cases/sellers/RegisterSeller";
import { ManageSeller } from "../../../application/use_cases/sellers/ManageSeller";
import { SellerService } from "../../../domain/services/SellerService";
import { SellerRepositoryImpl } from "../../repositories/SellerRepositoryImpl";

// Instancias de dependencias
const sellerRepository = new SellerRepositoryImpl();
const sellerService = new SellerService(sellerRepository);

/**
 * @swagger
 * /api/sellers:
 *   get:
 *     summary: Listar todos los vendedores
 *     description: Obtiene lista completa de vendedores registrados
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vendedores obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
export const getSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await sellerService.getAllSellers();
    res.json(sellers);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener sellers", error: error.message });
  }
};

/**
 * @swagger
 * /api/sellers/{id}:
 *   get:
 *     summary: Obtener vendedor por ID
 *     description: Obtiene los detalles de un vendedor específico
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vendedor
 *     responses:
 *       200:
 *         description: Vendedor obtenido exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vendedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const getSellerById = async (req: Request, res: Response) => {
  try {
    const manageSellerUseCase = new ManageSeller(sellerService);
    const id = Number(req.params.id);
    
    const seller = await manageSellerUseCase.getSellerProfile(id);
    
    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }
    res.json(seller);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener seller", error: error.message });
  }
};

/**
 * @swagger
 * /api/sellers:
 *   post:
 *     summary: Crear nuevo vendedor
 *     description: Registra un nuevo vendedor en el sistema
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seller_name
 *               - seller_email
 *               - seller_password
 *               - bussines_name
 *             properties:
 *               seller_name:
 *                 type: string
 *                 example: Carlos Rodríguez
 *               seller_email:
 *                 type: string
 *                 format: email
 *                 example: carlos@tienda.com
 *               seller_password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "0999876543"
 *               bussines_name:
 *                 type: string
 *                 example: TechStore Manta
 *               location:
 *                 type: string
 *                 example: Centro Comercial Espigón
 *     responses:
 *       201:
 *         description: Vendedor creado exitosamente
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
export const createSeller = async (req: Request, res: Response) => {
  try {
    const registerSellerUseCase = new RegisterSeller(sellerService);
    const seller = await registerSellerUseCase.execute(req.body);
    res.status(201).json(seller);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear seller" });
  }
};

/**
 * @swagger
 * /api/sellers/{id}:
 *   put:
 *     summary: Actualizar datos del vendedor
 *     description: Actualiza la información de un vendedor existente
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vendedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seller_name:
 *                 type: string
 *               seller_email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               bussines_name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendedor actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vendedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const updateSeller = async (req: Request, res: Response) => {
  try {
    const manageSellerUseCase = new ManageSeller(sellerService);
    const id = Number(req.params.id);
    
    const seller = await manageSellerUseCase.updateSellerProfile({
      id_seller: id,
      ...req.body,
    });
    
    res.json(seller);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar seller" });
  }
};

/**
 * @swagger
 * /api/sellers/{id}:
 *   delete:
 *     summary: Eliminar vendedor
 *     description: Elimina un vendedor del sistema por su ID
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vendedor
 *     responses:
 *       200:
 *         description: Vendedor eliminado correctamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vendedor no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const deleteSeller = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await sellerService.deleteSeller(id.toString());
    
    if (success) {
      res.json({ message: "Seller eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Seller no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar seller", error: error.message });
  }
};
