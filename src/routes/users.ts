import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const router = Router();

router.post("/first-users", async (req, res) => {
    const adminEmail = "admin@edecio.delivery";
    const userEmail = "cliente@edecio.delivery";

    try {
        // Criar ADMIN caso não exista
        if (!await prisma.user.findUnique({ where: { email: adminEmail } })) {
            await prisma.user.create({
                data: {
                    name: "Admin",
                    email: adminEmail,
                    password: await bcrypt.hash("admin123", 10),
                    role: "ADMIN"
                },
            });
        }

        // Criar USER caso não exista
        if (!await prisma.user.findUnique({ where: { email: userEmail } })) {
            await prisma.user.create({
                data: {
                    name: "Cliente",
                    email: userEmail,
                    password: await bcrypt.hash("123456", 10),
                    role: "USER"
                },
            });
        }

        res.json({ message: "Usuários criados caso não existissem" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao criar usuários iniciais" });
    }
});

export default router;