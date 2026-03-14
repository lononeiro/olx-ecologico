import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, nome: "usuario" },
    }),
    prisma.role.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, nome: "admin" },
    }),
    prisma.role.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, nome: "empresa" },
    }),
  ]);
  console.log("✅ Roles criadas:", roles.map((r) => r.nome).join(", "));

  // ── Material Tipos ─────────────────────────────────────────────────────────
  const materiais = [
    "Papel / Papelão",
    "Plástico",
    "Metal / Alumínio",
    "Vidro",
    "Eletrônicos (e-lixo)",
    "Orgânico",
    "Têxtil",
    "Óleo de Cozinha",
    "Madeira",
    "Borracha / Pneus",
  ];

  for (const nome of materiais) {
    await prisma.materialTipo.upsert({
      where: { id: materiais.indexOf(nome) + 1 },
      update: {},
      create: { nome },
    });
  }
  console.log("✅ Tipos de materiais criados:", materiais.length);

  // ── Usuário Admin padrão ───────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@recicla.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@recicla.com",
      senhaHash: adminHash,
      roleId: 2,
      status: "ativo",
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // ── Usuário comum de exemplo ───────────────────────────────────────────────
  const userHash = await bcrypt.hash("user123", 12);
  await prisma.user.upsert({
    where: { email: "joao@example.com" },
    update: {},
    create: {
      nome: "João Silva",
      email: "joao@example.com",
      senhaHash: userHash,
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      telefone: "11999990000",
      roleId: 1,
      status: "ativo",
    },
  });

  // ── Empresa de exemplo ─────────────────────────────────────────────────────
  const empresaHash = await bcrypt.hash("empresa123", 12);
  const empresaUser = await prisma.user.upsert({
    where: { email: "empresa@recicla.com" },
    update: {},
    create: {
      nome: "ReciclaMax Ltda",
      email: "empresa@recicla.com",
      senhaHash: empresaHash,
      roleId: 3,
      status: "ativo",
    },
  });

  await prisma.company.upsert({
    where: { userId: empresaUser.id },
    update: {},
    create: {
      userId: empresaUser.id,
      cnpj: "12.345.678/0001-90",
      descricao: "Empresa especializada em coleta e reciclagem de materiais.",
    },
  });
  console.log("✅ Empresa criada:", empresaUser.email);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("─────────────────────────────────────────");
  console.log("Credenciais de acesso:");
  console.log("  Admin:   admin@recicla.com  / admin123");
  console.log("  Usuário: joao@example.com   / user123");
  console.log("  Empresa: empresa@recicla.com / empresa123");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
