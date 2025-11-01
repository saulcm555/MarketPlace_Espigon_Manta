import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import AppDataSource from "../../database/data-source";
import { ClientEntity } from "../../../models/clientModel";
import { SellerEntity } from "../../../models/sellerModel";
import { AdminEntity } from "../../../models/adminModel";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * @swagger
 * /api/auth/login/client:
 *   post:
 *     summary: Login de cliente
 *     description: Autentica un cliente con email y contraseña, retorna token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: cliente@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: client
 *       400:
 *         description: Datos faltantes
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
export const loginClient = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const clientRepo = AppDataSource.getRepository(ClientEntity);
    const client = await clientRepo.findOne({ where: { client_email: email } });

    if (!client) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, client.client_password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: client.id_client,
        email: client.client_email,
        role: "client",
        name: client.client_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: client.id_client,
        email: client.client_email,
        name: client.client_name,
        role: "client",
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error en el login", error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/login/seller:
 *   post:
 *     summary: Login de vendedor
 *     description: Autentica un vendedor con email y contraseña, retorna token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: vendedor@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: seller
 *       400:
 *         description: Datos faltantes
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
export const loginSeller = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const sellerRepo = AppDataSource.getRepository(SellerEntity);
    const seller = await sellerRepo.findOne({ where: { seller_email: email } });

    if (!seller) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, seller.seller_password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: seller.id_seller,
        email: seller.seller_email,
        role: "seller",
        name: seller.seller_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: seller.id_seller,
        email: seller.seller_email,
        name: seller.seller_name,
        role: "seller",
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error en el login", error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/login/admin:
 *   post:
 *     summary: Login de administrador
 *     description: Autentica un administrador con email y contraseña, retorna token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Datos faltantes
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error interno del servidor
 */
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const adminRepo = AppDataSource.getRepository(AdminEntity);
    const admin = await adminRepo.findOne({ where: { admin_email: email } });

    if (!admin) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, admin.admin_password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: admin.id_admin,
        email: admin.admin_email,
        role: "admin",
        name: admin.admin_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: admin.id_admin,
        email: admin.admin_email,
        name: admin.admin_name,
        role: "admin",
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error en el login", error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token JWT
 *     description: Valida si el token JWT proporcionado es válido y retorna información del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     name:
 *                       type: string
 *       401:
 *         description: Token inválido o no proporcionado
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No se proporcionó token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    res.json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      },
    });
  } catch (error: any) {
    res.status(401).json({ valid: false, message: "Token inválido o expirado" });
  }
};

/**
 * @swagger
 * /api/auth/register/client:
 *   post:
 *     summary: Registro de nuevo cliente
 *     description: Registra un nuevo cliente en el sistema y retorna token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_name
 *               - email
 *               - password
 *             properties:
 *               client_name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan.perez@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "0999123456"
 *               address:
 *                 type: string
 *                 example: Calle Principal 123
 *     responses:
 *       201:
 *         description: Cliente registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: client
 *       400:
 *         description: Datos faltantes o email ya registrado
 *       500:
 *         description: Error interno del servidor
 */
export const registerClient = async (req: Request, res: Response) => {
  try {
    const { client_name, email, password, phone, address } = req.body;

    if (!client_name || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son requeridos" });
    }

    const clientRepo = AppDataSource.getRepository(ClientEntity);

    // Verificar si el email ya existe
    const existingClient = await clientRepo.findOne({ where: { client_email: email } });
    if (existingClient) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear cliente
    const newClient = clientRepo.create({
      client_name,
      client_email: email,
      client_password: hashedPassword,
      phone,
      address,
    });

    const savedClient = await clientRepo.save(newClient);

    // Generar token
    const token = jwt.sign(
      {
        id: savedClient.id_client,
        email: savedClient.client_email,
        role: "client",
        name: savedClient.client_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      message: "Cliente registrado exitosamente",
      token,
      user: {
        id: savedClient.id_client,
        email: savedClient.client_email,
        name: savedClient.client_name,
        role: "client",
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error al registrar cliente", error: error.message });
  }
};
