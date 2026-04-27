import { NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function GET() {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsuarios, totalEmpresas, totalSolicitacoes,
    solicitacoesPendentes, solicitacoesAprovadas, solicitacoesRejeitadas,
    coletasAceitas, coletasConcluidas, coletasCanceladas,
    materiaisAgg, empresasAgg, solicitacoesRecentes,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { nome: "usuario" } } }),
    prisma.company.count(),
    prisma.solicitacaoColeta.count(),
    prisma.solicitacaoColeta.count({ where: { status: "pendente" } }),
    prisma.solicitacaoColeta.count({ where: { status: "aprovada" } }),
    prisma.solicitacaoColeta.count({ where: { status: "rejeitada" } }),
    prisma.coleta.count({ where: { status: "aceita" } }),
    prisma.coleta.count({ where: { status: "concluida" } }),
    prisma.coleta.count({ where: { status: "cancelada" } }),
    prisma.solicitacaoColeta.groupBy({
      by: ["materialId"],
      _count: { _all: true },
      orderBy: { _count: { materialId: "desc" } },
      take: 5,
    }),
    prisma.coleta.groupBy({
      by: ["companyId"],
      _count: { _all: true },
      where: { status: "concluida" },
      orderBy: { _count: { companyId: "desc" } },
      take: 5,
    }),
    prisma.solicitacaoColeta.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  const materialIds = materiaisAgg.map(m => m.materialId);
  const materiais = materialIds.length > 0
    ? await prisma.materialTipo.findMany({ where: { id: { in: materialIds } } })
    : [];
  const materiaisTop = materiaisAgg.map(m => ({
    nome: materiais.find(mat => mat.id === m.materialId)?.nome ?? "?",
    total: m._count._all,
  }));

  const companyIds = empresasAgg.map(e => e.companyId);
  const companies = companyIds.length > 0
    ? await prisma.company.findMany({
        where: { id: { in: companyIds } },
        include: { user: { select: { nome: true } } },
      })
    : [];
  const empresasTop = empresasAgg.map(e => ({
    nome: companies.find(c => c.id === e.companyId)?.user.nome ?? "Empresa",
    total: e._count._all,
  }));

  // Aggregate solicitações by year-month key
  const monthSlots: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSlots.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()] });
  }
  const countByKey: Record<string, number> = Object.fromEntries(monthSlots.map(m => [m.key, 0]));
  for (const s of solicitacoesRecentes) {
    const d = new Date(s.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (k in countByKey) countByKey[k]++;
  }
  const solicitacoesPorMes = monthSlots.map(m => ({ mes: m.label, total: countByKey[m.key] }));

  return NextResponse.json({
    stats: {
      totalUsuarios, totalEmpresas, totalSolicitacoes,
      solicitacoesPendentes, solicitacoesAprovadas, solicitacoesRejeitadas,
      coletasAceitas, coletasConcluidas, coletasCanceladas,
    },
    materiaisTop,
    empresasTop,
    solicitacoesPorMes,
  });
}
