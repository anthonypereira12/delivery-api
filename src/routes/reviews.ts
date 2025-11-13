import { Router } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { verifyToken } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/restaurant/:restaurantId", async (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  const reviews = await prisma.review.findMany({
    where: { restaurantId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(reviews);
});

const createSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() });

router.post("/order/:orderId", verifyToken, async (req, res) => {
  const orderId = Number(req.params.orderId);
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
  if (order.userId !== (req as any).user.id) return res.status(403).json({ error: "Sem permissão" });
  if (order.status !== OrderStatus.DELIVERED) return res.status(400).json({ error: "Só é possível avaliar pedidos entregues" });
  const already = await prisma.review.findUnique({ where: { orderId } });
  if (already) return res.status(400).json({ error: "Pedido já avaliado" });
  const rv = await prisma.review.create({ data: { orderId, userId: (req as any).user.id, restaurantId: order.restaurantId, rating: parsed.data.rating, comment: parsed.data.comment } });
  res.json(rv);
});

export default router;
