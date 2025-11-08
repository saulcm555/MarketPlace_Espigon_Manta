import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import AppDataSource from "../../database/data-source";
import { ClientEntity } from "../../../models/clientModel";
import { SellerEntity } from "../../../models/sellerModel";
import { AdminEntity } from "../../../models/adminModel";
import { asyncHandler, BadRequestError, UnauthorizedError, ConflictError } from "../../middlewares/errors";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export const loginClient = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email y contraseña son requeridos");
  }

  const clientRepo = AppDataSource.getRepository(ClientEntity);
  const client = await clientRepo.findOne({ where: { client_email: email } });

  if (!client) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, client.client_password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Generar token JWT
  const token = jwt.sign(
    {
      id: client.id_client,
      id_client: client.id_client,
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
      id_client: client.id_client,
      email: client.client_email,
      name: client.client_name,
      role: "client",
    },
  });
});

export const loginSeller = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email y contraseña son requeridos");
  }

  const sellerRepo = AppDataSource.getRepository(SellerEntity);
  const seller = await sellerRepo.findOne({ where: { seller_email: email } });

  if (!seller) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, seller.seller_password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Generar token JWT
  const token = jwt.sign(
    {
      id: seller.id_seller,
      id_seller: seller.id_seller,
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
      id_seller: seller.id_seller,
      email: seller.seller_email,
      name: seller.seller_name,
      role: "seller",
    },
  });
});

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email y contraseña son requeridos");
  }

  const adminRepo = AppDataSource.getRepository(AdminEntity);
  const admin = await adminRepo.findOne({ where: { admin_email: email } });

  if (!admin) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, admin.admin_password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  // Generar token JWT
  const token = jwt.sign(
    {
      id: admin.id_admin,
      id_admin: admin.id_admin,
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
      id_admin: admin.id_admin,
      email: admin.admin_email,
      name: admin.admin_name,
      role: "admin",
    },
  });
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("No se proporcionó token");
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
});

export const registerClient = asyncHandler(async (req: Request, res: Response) => {
  const { client_name, email, password, phone, address } = req.body;

  if (!client_name || !email || !password) {
    throw new BadRequestError("Nombre, email y contraseña son requeridos");
  }

  const clientRepo = AppDataSource.getRepository(ClientEntity);

  // Verificar si el email ya existe
  const existingClient = await clientRepo.findOne({ where: { client_email: email } });
  if (existingClient) {
    throw new ConflictError("El email ya está registrado");
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
});

export const registerSeller = asyncHandler(async (req: Request, res: Response) => {
  const { seller_name, seller_email, seller_password, phone, bussines_name, location } = req.body;

  if (!seller_name || !seller_email || !seller_password || !phone || !bussines_name || !location) {
    throw new BadRequestError("Todos los campos son requeridos");
  }

  const sellerRepo = AppDataSource.getRepository(SellerEntity);

  // Verificar si el email ya existe
  const existingSeller = await sellerRepo.findOne({ where: { seller_email } });
  if (existingSeller) {
    throw new ConflictError("El email ya está registrado");
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(seller_password, 10);

  // Crear vendedor
  const newSeller = sellerRepo.create({
    seller_name,
    seller_email,
    seller_password: hashedPassword,
    phone,
    bussines_name,
    location,
  });

  const savedSeller = await sellerRepo.save(newSeller);

  // Generar token
  const token = jwt.sign(
    {
      id: savedSeller.id_seller,
      email: savedSeller.seller_email,
      role: "seller",
      name: savedSeller.seller_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  res.status(201).json({
    message: "Vendedor registrado exitosamente",
    token,
    user: {
      id: savedSeller.id_seller,
      email: savedSeller.seller_email,
      name: savedSeller.seller_name,
      role: "seller",
      business_name: savedSeller.bussines_name,
      location: savedSeller.location,
    },
  });
});
