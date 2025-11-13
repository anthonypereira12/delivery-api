import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verifyToken, requireRole } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/restaurant/:restaurantId", async (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  const featured = req.query.featured === 'true';
  const items = await prisma.item.findMany({ where: { restaurantId, ...(featured?{featured:true}:{}) }, orderBy: { name: "asc" } });
  res.json(items);
});

const upsertSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  imageUrl: z.string().optional(),
  restaurantId: z.number().int().positive(),
  featured: z.boolean().optional(),
});

router.post("/", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.item.create({ data: parsed.data }));
});

router.put("/:id", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.item.update({ where: { id }, data: parsed.data }));
});

router.delete("/:id", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.item.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
