import { Request, Response } from "express";
import { ManageCart } from "../../../application/use_cases/cart/ManageCart";
import { AddProductToCart } from "../../../application/use_cases/cart/AddProductToCart";
import { RemoveProductFromCart } from "../../../application/use_cases/cart/RemoveProductFromCart";
import { UpdateCartItemQuantity } from "../../../application/use_cases/cart/UpdateCartItemQuantity";
import { GetCartWithProducts } from "../../../application/use_cases/cart/GetCartWithProducts";
import { CartService } from "../../../domain/services/CartService";
import { CartRepositoryImpl } from "../../repositories/CartRepositoryImpl";

// Instancias de dependencias
const cartRepository = new CartRepositoryImpl();
const cartService = new CartService(cartRepository);

/**
 * @swagger
 * /api/carts:
 *   get:
 *     summary: Obtener todos los carritos
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de carritos obtenida exitosamente
 *       500:
 *         description: Error del servidor
 */
export const getCarts = async (req: Request, res: Response) => {
  try {
    // Para admin - obtener todos los carritos
    const carts = await cartService.getAllCarts();
    res.json(carts);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener carritos", error: error.message });
  }
};

/**
 * @swagger
 * /api/carts/{id}:
 *   get:
 *     summary: Obtener un carrito por ID
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *     responses:
 *       200:
 *         description: Carrito encontrado
 *       404:
 *         description: Carrito no encontrado
 *       500:
 *         description: Error del servidor
 */
export const getCartById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cart = await cartService.getCartById(id.toString());
    
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    res.json(cart);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener carrito", error: error.message });
  }
};

/**
 * @swagger
 * /api/carts:
 *   post:
 *     summary: Crear un nuevo carrito
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_client
 *             properties:
 *               id_client:
 *                 type: integer
 *                 description: ID del cliente
 *                 example: 1
 *               status:
 *                 type: string
 *                 description: Estado del carrito
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Carrito creado exitosamente
 *       500:
 *         description: Error al crear carrito
 */
export const createCart = async (req: Request, res: Response) => {
  try {
    // Agregar status por defecto si no se proporciona
    const cartData = {
      ...req.body,
      status: req.body.status || "active",
      quantity: req.body.quantity || 0,
      id_product: req.body.id_product || 0
    };
    
    cartService.createCart(cartData, (err, cart) => {
      if (err) {
        return res.status(500).json({ message: "Error al crear carrito", error: err.message });
      }
      res.status(201).json(cart);
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al crear carrito", error: error.message });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const manageCartUseCase = new ManageCart(cartService);
    const id = Number(req.params.id);
    
    const cart = await manageCartUseCase.updateCartItem({
      id_cart: id,
      quantity: req.body.quantity,
    });
    
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar carrito" });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    const manageCartUseCase = new ManageCart(cartService);
    const id = Number(req.params.id);
    
    const success = await manageCartUseCase.removeFromCart({ id_cart: id });
    
    if (success) {
      res.json({ message: "Carrito eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Carrito no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar carrito", error: error.message });
  }
};

// ============================================
// NUEVOS MÉTODOS PARA MANEJAR PRODUCTCART (TABLA TRANSACCIONAL)
// ============================================

/**
 * @swagger
 * /api/carts/{id}/products:
 *   post:
 *     summary: Agregar un producto al carrito (Tabla Transaccional ProductCart)
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_product
 *               - quantity
 *             properties:
 *               id_product:
 *                 type: integer
 *                 description: ID del producto a agregar
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 description: Cantidad del producto
 *                 example: 2
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Producto agregado al carrito exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autenticado
 */
export const addProductToCart = async (req: Request, res: Response) => {
  try {
    const addProductUseCase = new AddProductToCart();
    const id_cart = Number(req.params.id);
    
    const productCart = await addProductUseCase.execute({
      id_cart,
      id_product: req.body.id_product,
      quantity: req.body.quantity,
    });
    
    res.status(201).json(productCart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al agregar producto al carrito" });
  }
};

/**
 * @swagger
 * /api/carts/{id}/products/{productId}:
 *   delete:
 *     summary: Eliminar un producto del carrito (Tabla Transaccional ProductCart)
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito correctamente
 *       404:
 *         description: Producto no encontrado en el carrito
 *       400:
 *         description: Error en la solicitud
 */
export const removeProductFromCart = async (req: Request, res: Response) => {
  try {
    const removeProductUseCase = new RemoveProductFromCart();
    const id_cart = Number(req.params.id);
    const id_product = Number(req.params.productId);
    
    // Buscar el ProductCart por id_cart y id_product
    const success = await removeProductUseCase.execute({ id_cart, id_product });
    
    if (success) {
      res.json({ message: "Producto eliminado del carrito correctamente" });
    } else {
      res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al eliminar producto del carrito" });
  }
};

/**
 * @swagger
 * /api/carts/{id}/products/{productId}:
 *   put:
 *     summary: Actualizar cantidad de un producto en el carrito (Tabla Transaccional ProductCart)
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Nueva cantidad del producto
 *                 example: 5
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cantidad actualizada exitosamente
 *       400:
 *         description: Error en la solicitud
 */
export const updateCartItemQuantity = async (req: Request, res: Response) => {
  try {
    const updateQuantityUseCase = new UpdateCartItemQuantity();
    const id_cart = Number(req.params.id);
    const id_product = Number(req.params.productId);
    
    const productCart = await updateQuantityUseCase.execute({
      id_cart,
      id_product,
      quantity: req.body.quantity,
    });
    
    res.json(productCart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar cantidad" });
  }
};

/**
 * @swagger
 * /api/carts/{id}/with-products:
 *   get:
 *     summary: Obtener carrito con todos sus productos (Tabla Transaccional ProductCart)
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del carrito
 *     responses:
 *       200:
 *         description: Carrito con productos obtenido exitosamente
 *       404:
 *         description: Carrito no encontrado
 *       400:
 *         description: Error en la solicitud
 */
export const getCartWithProducts = async (req: Request, res: Response) => {
  try {
    const getCartUseCase = new GetCartWithProducts();
    const id_cart = Number(req.params.id);
    
    const cart = await getCartUseCase.execute(id_cart);
    
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }
    
    res.json(cart);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al obtener carrito" });
  }
};
