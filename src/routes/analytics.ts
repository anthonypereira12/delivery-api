import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken, requireRole } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/orders-by-status", async (_req, res) => {
  const rows = await prisma.order.groupBy({ by: ["status"], _count: { status: true } });
  res.json(rows.map(r => ({ status: r.status, count: r._count.status })));
});

router.get("/revenue-by-restaurant", async (_req, res) => {
  const rows = await prisma.order.groupBy({ by: ["restaurantId"], _sum: { totalCents: true } });
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, name: true } });
  const nameById = Object.fromEntries(restaurants.map(r => [r.id, r.name]));
  res.json(rows.map(r => ({ restaurantId: r.restaurantId, restaurant: nameById[r.restaurantId] || String(r.restaurantId), totalCents: r._sum.totalCents || 0 })));
});

router.get("/orders-by-day", async (_req, res) => {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate()-13);
  const data = await prisma.order.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } });
  const map: Record<string, number> = {};
  for(let i=0;i<14;i++){ const d=new Date(start); d.setDate(start.getDate()+i); map[d.toISOString().slice(0,10)]=0; }
  for(const o of data){ const key=o.createdAt.toISOString().slice(0,10); if(map[key]!=null) map[key]++; }
  res.json(Object.entries(map).map(([date,count])=>({ date, count })));
});

export default router;
