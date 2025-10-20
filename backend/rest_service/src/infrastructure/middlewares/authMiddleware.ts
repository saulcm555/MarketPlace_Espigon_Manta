import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "No token provided" });
	}
	const token = authHeader?.split(" ")[1];
    if (!token) {
    return res.status(401).json({ message: "No token provided" });
    }
    try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
    } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
}
}
