import { Request, Response, NextFunction } from "express";

export function roleMiddleware(requiredRole: string) {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = (req as any).user;
		if (!user || !user.role) {
			return res.status(403).json({ message: "No user role found" });
		}
		if (user.role !== requiredRole) {
			return res.status(403).json({ message: `Access denied: requires role ${requiredRole}` });
		}
		next();
	};
}
