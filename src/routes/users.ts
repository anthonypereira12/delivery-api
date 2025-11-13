import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const router = Router();

router.post("/first-admin", async (req, res) => {
  const exists = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (exists) return res.status(400).json({ error: "Admin já existe" });

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@admin.com",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN"
    }
  });

  res.json({ message: "Primeiro ADMIN criado", admin });
});

export default router;
