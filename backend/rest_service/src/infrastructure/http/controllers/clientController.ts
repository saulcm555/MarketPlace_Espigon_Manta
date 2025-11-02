import { Request, Response } from "express";
import { RegisterClient } from "../../../application/use_cases/clients/RegisterClient";
import { LoginClient } from "../../../application/use_cases/clients/LoginClient";
import { UpdateClientProfile } from "../../../application/use_cases/clients/UpdateClientProfile";
import { ClientService } from "../../../domain/services/ClientService";
import { ClientRepositoryImpl } from "../../repositories/ClientRepositoryImpl";

// Instancias de dependencias
const clientRepository = new ClientRepositoryImpl();
const clientService = new ClientService(clientRepository);

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Listar todos los clientes
 *     description: Obtiene lista completa de clientes registrados
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener clientes", error: error.message });
  }
};

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     description: Obtiene los detalles de un cliente específico
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente obtenido exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const getClientById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const client = await clientService.getClientById(id.toString());
    
    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(client);
  } catch (error: any) {
    res.status(500).json({ message: "Error al obtener cliente", error: error.message });
  }
};

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Crear nuevo cliente
 *     description: Registra un nuevo cliente en el sistema
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *               - client_email
 *               - client_password
 *             properties:
 *               client_name:
 *                 type: string
 *                 example: María García
 *               client_email:
 *                 type: string
 *                 format: email
 *                 example: maria.garcia@example.com
 *               client_password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "0999123456"
 *               address:
 *                 type: string
 *                 example: Av. Principal 456
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *       400:
 *         description: Datos inválidos o faltantes
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
 */
export const createClient = async (req: Request, res: Response) => {
  try {
    const registerClientUseCase = new RegisterClient(clientService);
    const client = await registerClientUseCase.execute(req.body);
    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al crear cliente" });
  }
};

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Actualizar datos del cliente
 *     description: Actualiza la información de un cliente existente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_name:
 *                 type: string
 *               client_email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const updateClient = async (req: Request, res: Response) => {
  try {
    const updateClientProfileUseCase = new UpdateClientProfile(clientService);
    const id = Number(req.params.id);
    
    const client = await updateClientProfileUseCase.execute({
      id_client: id,
      ...req.body,
    });
    
    res.json(client);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error al actualizar cliente" });
  }
};

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Eliminar cliente
 *     description: Elimina un cliente del sistema por su ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente eliminado correctamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
export const deleteClient = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await clientService.deleteClient(id.toString());
    
    if (success) {
      res.json({ message: "Cliente eliminado correctamente" });
    } else {
      res.status(404).json({ message: "Cliente no encontrado" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Error al eliminar cliente", error: error.message });
  }
};
