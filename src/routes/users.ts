import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { verifyToken } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(4),
    role: z.nativeEnum(Role).optional() // Só ADMIN pode definir
  });
  
  /*
    Criar usuário (ADMIN cria qualquer tipo / normal só USER)
  */
  router.post("/", verifyToken, async (req, res) => {
    const user = (req as any).user;
    const parsed = createUserSchema.safeParse(req.body);
  
    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }
  
    let { name, email, password, role } = parsed.data;
  
    // Usuário comum sempre vira USER
    if (user.role !== "ADMIN") {
      role = Role.USER;
    }
  
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }
  
    const hashed = await bcrypt.hash(password, 10);
  
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role ?? Role.USER
      }
    });
  
    return res.json(newUser);
  });

router.post("/first-admin", async (req, res) => {
  const exists = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (exists) return res.status(400).json({ error: "Admin já existe" });

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@edecio.delivery",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN"
    }
  });

  res.json({ message: "Primeiro ADMIN criado", admin });
});

export default router;
