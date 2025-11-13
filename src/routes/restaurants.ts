import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { verifyToken, requireRole } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    include: { reviews: { select: { rating: true } } }
  });
  const withAvg = restaurants.map((r:any) => ({
    ...r,
    avgRating: r.reviews.length ? (r.reviews.reduce((s:number,x:any)=>s+x.rating,0)/r.reviews.length) : null
  }));
  res.json(withAvg);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const restaurant = await prisma.restaurant.findUnique({ where: { id }, include: { items: true } });
  if (!restaurant) return res.status(404).json({ error: "Restaurante não encontrado" });
  res.json(restaurant);
});

const upsertSchema = z.object({ name: z.string().min(2), imageUrl: z.string().optional(), category: z.string().optional() });

router.post("/", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.restaurant.create({ data: parsed.data }));
});

router.put("/:id", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  res.json(await prisma.restaurant.update({ where: { id }, data: parsed.data }));
});

router.delete("/:id", verifyToken, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.restaurant.delete({ where: { id } });
  res.json({ ok: true });
});

router.post("/seed", async (_req, res) => {
  try {
    // Cria ou atualiza o restaurante principal
    const r = await prisma.restaurant.upsert({
      where: { name: "Delícias do Edécio" },
      create: {
        name: "Delícias do Edécio",
        category: "Caseira",
        imageUrl:
          "https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1600&auto=format&fit=crop",
      },
      update: {},
    });

    // Remove todos os itens antigos do restaurante
    await prisma.item.deleteMany({ where: { restaurantId: r.id } });

    // Cria os novos itens
    await prisma.item.createMany({
      data: [
        {
          name: "Prato Feito do Edécio",
          description:
            "Arroz, feijão, bife acebolado, salada e batata frita",
          priceCents: 3490,
          restaurantId: r.id,
          featured: true,
          imageUrl:
            "https://images.unsplash.com/photo-1604908815070-c3a9c49a61b9?q=80&w=1600&auto=format&fit=crop",
        },
        {
          name: "Lasanha à Bolonhesa",
          description:
            "Massa fresca com molho bolonhesa e muito queijo",
          priceCents: 4290,
          restaurantId: r.id,
          featured: true,
          imageUrl:
            "https://images.unsplash.com/photo-1604908177076-9f17d4a2a3c3?q=80&w=1600&auto=format&fit=crop",
        },
        {
          name: "Strogonoff de Frango",
          description: "Acompanha arroz e batata palha",
          priceCents: 3790,
          restaurantId: r.id,
          featured: false,
          imageUrl:
            "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1600&auto=format&fit=crop",
        },
        {
          name: "Hambúrguer da Casa",
          description: "Blend artesanal, cheddar e pão brioche",
          priceCents: 3290,
          restaurantId: r.id,
          featured: false,
          imageUrl:
            "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1600&auto=format&fit=crop",
        },
        {
          name: "Brownie com Sorvete",
          description: "Sobremesa queridinha da casa",
          priceCents: 1990,
          restaurantId: r.id,
          featured: true,
          imageUrl:
            "https://images.unsplash.com/photo-1606313564200-e75d5e30476f?q=80&w=1600&auto=format&fit=crop",
        },
      ],
    });

    const items = await prisma.item.findMany({ where: { restaurantId: r.id } });

    res.json({
      message: "Restaurante e itens criados com sucesso!",
      restaurant: r,
      items,
    });
  } catch (err) {
    console.error("Erro ao criar seed:", err);
    res.status(500).json({ error: "Erro ao criar restaurante e itens" });
  }
});

export default router;
