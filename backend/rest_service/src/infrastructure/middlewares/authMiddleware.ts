import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

// ============================================
// CONFIGURACIÓN JWT - Compatible con Auth Service
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || "supersecreto123";
const JWT_ISSUER = process.env.JWT_ISSUER || "auth-service";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "marketplace-espigon";
const SERVICE_TOKEN = "internal-service-graphql-reports-2024";

// Interface para el payload del token del Auth Service
interface AuthTokenPayload {
	jti: string;          // JWT ID (para blacklist)
	sub: string;          // User ID (UUID)
	email: string;
	role: "client" | "seller" | "admin";
	reference_id: number; // id_client, id_seller, o id_admin
	name: string;
	iss: string;
	aud: string;
	iat: number;
	exp: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
	// Verificar si es una petición de servicio interno
	const serviceToken = req.headers["x-service-token"] as string;
	const internalService = req.headers["x-internal-service"] as string;
	
	if (serviceToken && serviceToken === SERVICE_TOKEN && internalService === "report-service") {
		// Es una petición interna válida, permitir acceso
		(req as any).user = { 
			type: "internal-service", 
			service: internalService,
			role: "service"
		};
		return next();
	}

	// Si no es servicio interno, verificar JWT
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "No token provided" });
	}
	
	const token = authHeader?.split(" ")[1];
	if (!token) {
		return res.status(401).json({ message: "No token provided" });
	}
	
	try {
		// Validación LOCAL del token del Auth Service
		const decoded = jwt.verify(token, JWT_SECRET, {
			issuer: JWT_ISSUER,
			audience: JWT_AUDIENCE,
		}) as AuthTokenPayload;

		// Mapear el payload del Auth Service al formato esperado por el REST Service
		(req as any).user = {
			id: decoded.sub,              // UUID del usuario en auth_service.users
			email: decoded.email,
			role: decoded.role,
			name: decoded.name,
			reference_id: decoded.reference_id,  // id_client, id_seller, id_admin
			jti: decoded.jti,
			// Mantener compatibilidad con código existente que usa id_seller, id_client, etc.
			...(decoded.role === "seller" && { id_seller: decoded.reference_id }),
			...(decoded.role === "client" && { id_client: decoded.reference_id }),
			...(decoded.role === "admin" && { id_admin: decoded.reference_id }),
		};
		
		next();
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			return res.status(401).json({ 
				message: "Token expired", 
				code: "TOKEN_EXPIRED" 
			});
		}
		if (err instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({ 
				message: "Invalid token",
				code: "INVALID_TOKEN"
			});
		}
		return res.status(401).json({ message: "Authentication failed" });
	}
}

