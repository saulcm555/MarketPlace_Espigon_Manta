import { Request, Response, NextFunction } from "express";

export function roleMiddleware(requiredRole: string | string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = (req as any).user;
		if (!user || !user.role) {
			return res.status(403).json({ message: "No user role found" });
		}
		
		// Convertir a array si es un string único
		const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
		
		if (!allowedRoles.includes(user.role)) {
			return res.status(403).json({ 
				message: `Access denied: requires role ${allowedRoles.join(' or ')}` 
			});
		}
		next();
	};
}
