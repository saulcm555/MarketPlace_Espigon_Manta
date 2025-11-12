import { Request, Response, NextFunction } from "express";
import AppDataSource from "../database/data-source";
import { ClientEntity } from "../../models/clientModel";
import { SellerEntity } from "../../models/sellerModel";
import { ProductEntity } from "../../models/productModel";
import { InventoryEntity } from "../../models/inventoryModel";
import { CartEntity } from "../../models/cartModel";

/**
 * Middleware de verificación de ownership (propiedad de recursos)
 * Valida que el usuario autenticado sea el dueño del recurso solicitado
 * o sea un administrador.
 * 
 * @param resourceType - Tipo de recurso: "client", "seller", "product", "inventory", "cart"
 * @returns Middleware function
 */
export function ownershipMiddleware(resourceType: "client" | "seller" | "product" | "inventory" | "cart") {
	return async (req: Request, res: Response, next: NextFunction) => {
		const user = (req as any).user;
		const resourceId = parseInt(req.params.id || "0");

		// Validar que existe usuario y resourceId
		if (!user || !user.id) {
			return res.status(401).json({ message: "Usuario no autenticado" });
		}

		if (isNaN(resourceId)) {
			return res.status(400).json({ message: "ID de recurso inválido" });
		}

		// Los admins siempre tienen acceso total
		if (user.role === "admin") {
			return next();
		}

		try {
			switch (resourceType) {
				case "client":
					await validateClientOwnership(user, resourceId, res, next);
					break;

				case "seller":
					await validateSellerOwnership(user, resourceId, res, next);
					break;

				case "product":
					await validateProductOwnership(user, resourceId, res, next);
					break;

				case "inventory":
					await validateInventoryOwnership(user, resourceId, res, next);
					break;

				case "cart":
					await validateCartOwnership(user, resourceId, res, next);
					break;

				default:
					return res.status(500).json({ message: "Tipo de recurso no soportado" });
			}
		} catch (error) {
			console.error("Error en ownershipMiddleware:", error);
			return res.status(500).json({ message: "Error al validar ownership" });
		}
	};
}

/**
 * Valida que el cliente sea el dueño del recurso
 */
async function validateClientOwnership(
	user: any,
	clientId: number,
	res: Response,
	next: NextFunction
) {
	// Si el usuario no es cliente, denegar acceso
	if (user.role !== "client") {
		return res.status(403).json({ 
			message: "Acceso denegado: solo clientes pueden acceder a este recurso" 
		});
	}

	// Verificar que el id del cliente en el token coincida con el recurso solicitado
	const clientRepo = AppDataSource.getRepository(ClientEntity);
	const client = await clientRepo.findOne({ where: { id_client: clientId } });

	if (!client) {
		return res.status(404).json({ message: "Cliente no encontrado" });
	}

	// Verificar ownership: el id_client del token debe coincidir con el recurso
	if (client.id_client !== user.id_client) {
		return res.status(403).json({ 
			message: "Acceso denegado: no puedes acceder a datos de otro cliente" 
		});
	}

	next();
}

/**
 * Valida que el seller sea el dueño del recurso
 */
async function validateSellerOwnership(
	user: any,
	sellerId: number,
	res: Response,
	next: NextFunction
) {
	// Si el usuario no es seller, denegar acceso
	if (user.role !== "seller") {
		return res.status(403).json({ 
			message: "Acceso denegado: solo vendedores pueden acceder a este recurso" 
		});
	}

	// Verificar que el id del seller en el token coincida con el recurso solicitado
	const sellerRepo = AppDataSource.getRepository(SellerEntity);
	const seller = await sellerRepo.findOne({ where: { id_seller: sellerId } });

	if (!seller) {
		return res.status(404).json({ message: "Vendedor no encontrado" });
	}

	// Verificar ownership: el id_seller del token debe coincidir con el recurso
	if (seller.id_seller !== user.id_seller) {
		return res.status(403).json({ 
			message: "Acceso denegado: no puedes acceder a datos de otro vendedor" 
		});
	}

	next();
}

/**
 * Valida que el producto pertenezca al seller autenticado
 */
async function validateProductOwnership(
	user: any,
	productId: number,
	res: Response,
	next: NextFunction
) {
	// Si el usuario no es seller, denegar acceso
	if (user.role !== "seller") {
		return res.status(403).json({ 
			message: "Acceso denegado: solo vendedores pueden modificar productos" 
		});
	}

	const productRepo = AppDataSource.getRepository(ProductEntity);
	const product = await productRepo.findOne({ 
		where: { id_product: productId }
	});

	if (!product) {
		return res.status(404).json({ message: "Producto no encontrado" });
	}

	// Verificar ownership: el producto debe pertenecer al seller autenticado
	// ProductEntity tiene id_seller directamente
	const sellerRepo = AppDataSource.getRepository(SellerEntity);
	const seller = await sellerRepo.findOne({ where: { id_seller: product.id_seller } });
	
	if (!seller) {
		return res.status(404).json({ message: "Vendedor del producto no encontrado" });
	}

	if (seller.id_seller !== user.id_seller) {
		return res.status(403).json({ 
			message: "Acceso denegado: este producto pertenece a otro vendedor" 
		});
	}

	next();
}

/**
 * Valida que el inventario pertenezca al seller autenticado
 */
async function validateInventoryOwnership(
	user: any,
	inventoryId: number,
	res: Response,
	next: NextFunction
) {
	// Si el usuario no es seller, denegar acceso
	if (user.role !== "seller") {
		return res.status(403).json({ 
			message: "Acceso denegado: solo vendedores pueden acceder a inventarios" 
		});
	}

	const inventoryRepo = AppDataSource.getRepository(InventoryEntity);
	const inventory = await inventoryRepo.findOne({ 
		where: { id_inventory: inventoryId },
		relations: ["seller"]
	});

	if (!inventory) {
		return res.status(404).json({ message: "Inventario no encontrado" });
	}

	// Verificar ownership: el inventario debe pertenecer al seller autenticado
	if (inventory.seller.id_seller !== user.id_seller) {
		return res.status(403).json({ 
			message: "Acceso denegado: este inventario pertenece a otro vendedor" 
		});
	}

	next();
}

/**
 * Valida que el carrito pertenezca al cliente autenticado
 */
async function validateCartOwnership(
	user: any,
	cartId: number,
	res: Response,
	next: NextFunction
) {
	// Si el usuario no es cliente, denegar acceso
	if (user.role !== "client") {
		return res.status(403).json({ 
			message: "Acceso denegado: solo clientes pueden acceder a carritos" 
		});
	}

	const cartRepo = AppDataSource.getRepository(CartEntity);
	const cart = await cartRepo.findOne({ 
		where: { id_cart: cartId },
		relations: ["client"]
	});

	if (!cart) {
		return res.status(404).json({ message: "Carrito no encontrado" });
	}

	// Verificar ownership: el carrito debe pertenecer al cliente autenticado
	if (cart.client.id_client !== user.id_client) {
		return res.status(403).json({ 
			message: "Acceso denegado: este carrito pertenece a otro cliente" 
		});
	}

	next();
}
