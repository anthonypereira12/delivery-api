import { Router } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { z } from "zod";
import { verifyToken } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

const createOrderSchema = z.object({
  restaurantId: z.number().int().positive(),
  address: z.string().min(5),
  items: z.array(z.object({ itemId: z.number().int().positive(), qty: z.number().int().positive() })).min(1)
});

router.post("/", verifyToken, async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { restaurantId, address, items } = parsed.data;

  const dbItems = await prisma.item.findMany({ where: { id: { in: items.map(i => i.itemId) } } });
  if (dbItems.length !== items.length) return res.status(400).json({ error: "Item inválido" });

  const totalCents = items.reduce((s,i)=> s + (dbItems.find(d=>d.id===i.itemId)!.priceCents * i.qty), 0);

  const order = await prisma.order.create({
    data: {
      userId: (req as any).user.id,
      restaurantId,
      address,
      totalCents,
      items: { create: items.map(i => ({ itemId: i.itemId, qty: i.qty, priceCents: dbItems.find(d=>d.id===i.itemId)!.priceCents })) }
    },
    include: { items: { include: { item: true } }, restaurant: true }
  });

  res.json(order);
});

router.get("/", verifyToken, async (req, res) => {
  const user = (req as any).user;
  const where = user.role === "ADMIN" ? {} : { userId: user.id };
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { item: true } }, restaurant: true, user: true, review: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(orders);
});

const statusSchema = z.object({ status: z.nativeEnum(OrderStatus) });
router.patch("/:id/status", verifyToken, async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "ADMIN") return res.status(403).json({ error: "Sem permissão" });
  const id = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.order.update({ where: { id }, data: { status: parsed.data.status } }));
});

export default router;
