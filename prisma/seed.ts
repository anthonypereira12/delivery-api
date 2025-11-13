import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@edecio.delivery";
  if (!await prisma.user.findUnique({ where: { email: adminEmail } })) {
    await prisma.user.create({
      data: { name: "Admin", email: adminEmail, password: await bcrypt.hash("admin123", 10), role: "ADMIN" },
    });
  }

  const userEmail = "cliente@edecio.delivery";
  if (!await prisma.user.findUnique({ where: { email: userEmail } })) {
    await prisma.user.create({
      data: { name: "Cliente", email: userEmail, password: await bcrypt.hash("123456", 10), role: "USER" },
    });
  }

  const r = await prisma.restaurant.upsert({
    where: { name: "Delícias do Edécio" },
    create: {
      name: "Delícias do Edécio",
      category: "Caseira",
      imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1600&auto=format&fit=crop",
    },
    update: {},
  });

  await prisma.item.deleteMany({ where: { restaurantId: r.id } });
  await prisma.item.createMany({
    data: [
      { name: "Prato Feito do Edécio", description: "Arroz, feijão, bife acebolado, salada e batata frita", priceCents: 3490, restaurantId: r.id, featured: true, imageUrl: "https://images.unsplash.com/photo-1604908815070-c3a9c49a61b9?q=80&w=1600&auto=format&fit=crop" },
      { name: "Lasanha à Bolonhesa", description: "Massa fresca com molho bolonhesa e muito queijo", priceCents: 4290, restaurantId: r.id, featured: true, imageUrl: "https://images.unsplash.com/photo-1604908177076-9f17d4a2a3c3?q=80&w=1600&auto=format&fit=crop" },
      { name: "Strogonoff de Frango", description: "Acompanha arroz e batata palha", priceCents: 3790, restaurantId: r.id, featured: false, imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1600&auto=format&fit=crop" },
      { name: "Hambúrguer da Casa", description: "Blend artesanal, cheddar e pão brioche", priceCents: 3290, restaurantId: r.id, featured: false, imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1600&auto=format&fit=crop" },
      { name: "Brownie com Sorvete", description: "Sobremesa queridinha da casa", priceCents: 1990, restaurantId: r.id, featured: true, imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476f?q=80&w=1600&auto=format&fit=crop" },
    ],
  });
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
