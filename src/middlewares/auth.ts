import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload { id: number; role: "USER" | "ADMIN"; }

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Token ausente" });
  const token = auth.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token inválido" });
  try {
    const secret = process.env.JWT_SECRET || "dev";
    const payload = jwt.verify(token, secret) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(role: "ADMIN" | "USER") {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthPayload | undefined;
    if (!user) return res.status(401).json({ error: "Não autenticado" });
    if (user.role !== role && user.role !== "ADMIN") return res.status(403).json({ error: "Sem permissão" });
    next();
  };
}
