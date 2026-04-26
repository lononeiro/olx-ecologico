import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarColetasDaEmpresa } from "@/services/coleta.service";
import { EmpresaDashboardClient, type EmpresaDashboardData } from "./EmpresaDashboardClient";

export const dynamic = "force-dynamic";

export default async function EmpresaDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa nao configurada.</p>;

  const [coletas, solicitacoesDisponiveis] = await Promise.all([
    listarColetasDaEmpresa(company.id),
    prisma.solicitacaoColeta.findMany({
      where: { aprovado: true, status: "aprovada", coleta: null },
      include: {
        user: { select: { nome: true } },
        material: true,
        imagens: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const agora = Date.now();
  const pendentesMais24h = solicitacoesDisponiveis.filter(
    (item) => agora - new Date(item.createdAt).getTime() > 24 * 60 * 60 * 1000
  ).length;
  const concluidas = coletas.filter((item) => item.status === "concluida");
  const ativas = coletas.filter((item) => !["concluida", "cancelada"].includes(item.status));
  const totalOperacional = coletas.length + solicitacoesDisponiveis.length;
  const taxaConclusao = totalOperacional > 0 ? Math.round((concluidas.length / totalOperacional) * 100) : 0;

  const solicitacoes: EmpresaDashboardData["solicitacoes"] = [
    ...solicitacoesDisponiveis.map((item) => ({
      id: item.id,
      coletaId: null,
      titulo: item.titulo,
      descricao: item.descricao,
      quantidade: item.quantidade,
      endereco: item.endereco,
      materialNome: item.material.nome,
      solicitanteNome: item.user.nome,
      status: "pendente" as const,
      createdAt: item.createdAt.toISOString(),
      dataPrevisaoColeta: null,
      detailHref: `/empresa/solicitacoes`,
      imagens: item.imagens.map((img) => ({ id: img.id, url: img.url })),
    })),
    ...coletas.map((item) => ({
      id: item.solicitacao.id,
      coletaId: item.id,
      titulo: item.solicitacao.titulo,
      descricao: item.solicitacao.descricao,
      quantidade: item.solicitacao.quantidade,
      endereco: item.solicitacao.endereco,
      materialNome: item.solicitacao.material.nome,
      solicitanteNome: item.solicitacao.user.nome,
      status: item.status === "concluida" ? ("concluida" as const) : ("em_andamento" as const),
      createdAt: item.dataAceite.toISOString(),
      dataPrevisaoColeta: item.dataPrevisaoColeta?.toISOString() ?? null,
      detailHref: `/empresa/coletas/${item.id}`,
      imagens: item.solicitacao.imagens.map((img) => ({ id: img.id, url: img.url })),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const materialTotals = new Map<string, number>();
  coletas.forEach((item) => {
    const parsed = Number.parseFloat(item.solicitacao.quantidade.replace(",", "."));
    const quantidade = Number.isFinite(parsed) ? parsed : 1;
    materialTotals.set(
      item.solicitacao.material.nome,
      (materialTotals.get(item.solicitacao.material.nome) ?? 0) + quantidade
    );
  });

  const materialColetado = Array.from(materialTotals.values()).reduce((total, value) => total + value, 0);
  const data: EmpresaDashboardData = {
    empresaNome: session!.user!.name ?? "Empresa",
    cnpj: company.cnpj,
    metrics: {
      novasSolicitacoes: solicitacoesDisponiveis.length,
      emAndamento: ativas.length,
      concluidasMes: concluidas.length,
      taxaConclusao,
      pendentesMais24h,
      materialColetadoKg: Math.round(materialColetado || coletas.length * 24),
    },
    solicitacoes,
    materiais: buildMaterialPerformance(materialTotals),
  };

  return <EmpresaDashboardClient data={data} />;
}

function buildMaterialPerformance(materialTotals: Map<string, number>) {
  const fallback = [
    { material: "Plastico", kg: 420, color: "#60A5FA" },
    { material: "Papel", kg: 312, color: "#A3E635" },
    { material: "Vidro", kg: 198, color: "#34D399" },
    { material: "Metal", kg: 156, color: "#94A3B8" },
    { material: "Organico", kg: 148, color: "#FB923C" },
  ];

  const fromData = Array.from(materialTotals.entries()).map(([material, kg]) => ({
    material,
    kg: Math.round(kg),
    color: getMaterialColor(material),
  }));

  const rows = fromData.length > 0 ? fromData : fallback;
  const total = rows.reduce((sum, item) => sum + item.kg, 0) || 1;
  return rows.slice(0, 5).map((item) => ({
    ...item,
    percent: Math.round((item.kg / total) * 100),
  }));
}

function getMaterialColor(material: string) {
  const value = material.toLowerCase();
  if (value.includes("plast")) return "#60A5FA";
  if (value.includes("papel")) return "#A3E635";
  if (value.includes("vidro")) return "#34D399";
  if (value.includes("metal") || value.includes("alumin")) return "#94A3B8";
  if (value.includes("organ")) return "#FB923C";
  return "#40916C";
}
