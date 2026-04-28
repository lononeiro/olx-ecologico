import { prisma } from "@/lib/prisma";
import { AdminMateriaisClient } from "./AdminMateriaisClient";

export const dynamic = "force-dynamic";

export default async function AdminMateriaisPage() {
  const materiais = await prisma.materialTipo.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { solicitacoes: true } } },
  });

  return <AdminMateriaisClient initialMateriais={materiais} />;
}
