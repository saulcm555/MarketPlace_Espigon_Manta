import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const SERVICE_TOKEN = "internal-service-graphql-reports-2024";

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

	// Si no es servicio interno, verificar JWT como siempre
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "No token provided" });
	}
	const token = authHeader?.split(" ")[1];
    if (!token) {
		return res.status(401).json({ message: "No token provided" });
    }
    try {
		const decoded = jwt.verify(token, JWT_SECRET);
		(req as any).user = decoded;
		next();
    } catch (err) {
		return res.status(401).json({ message: "Invalid token" });
	}
}
