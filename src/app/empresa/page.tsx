import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarColetasDaEmpresa } from "@/services/coleta.service";
import { listarSolicitacoesAprovadas } from "@/services/solicitacao.service";
import { calcularMediaEmpresa } from "@/services/avaliacao.service";
import { EmpresaDashboardClient, type EmpresaDashboardData } from "./EmpresaDashboardClient";

export const dynamic = "force-dynamic";

export default async function EmpresaDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa nao configurada.</p>;

  const [coletas, solicitacoesDisponiveis, avaliacaoData] = await Promise.all([
    listarColetasDaEmpresa(company.id),
    listarSolicitacoesAprovadas(),
    calcularMediaEmpresa(company.id),
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
      endereco: item.endereco ?? "Regiao nao informada",
      materialNome: item.material.nome,
      solicitanteNome: "Disponivel apos aceite",
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

  const materialCounts = new Map<string, number>();
  coletas.forEach((item) => {
    const nome = item.solicitacao.material.nome;
    materialCounts.set(nome, (materialCounts.get(nome) ?? 0) + 1);
  });
  const materiaisContagem = Array.from(materialCounts.entries())
    .map(([material, total]) => ({ material, total, color: getMaterialColor(material) }))
    .sort((a, b) => b.total - a.total);

  const statusOrder = ["concluida", "em_coleta", "a_caminho", "aceita", "cancelada"];
  const statusCount = new Map<string, number>();
  coletas.forEach((item) => {
    statusCount.set(item.status, (statusCount.get(item.status) ?? 0) + 1);
  });
  const totalColetas = coletas.length;
  const coletasPorStatus = statusOrder
    .map((status) => ({ status, total: statusCount.get(status) ?? 0 }))
    .filter((row) => row.total > 0)
    .map((row) => ({
      ...row,
      percent: totalColetas > 0 ? Math.round((row.total / totalColetas) * 100) : 0,
    }));

  const cidadaosAtendidos = new Set(coletas.map((item) => item.solicitacao.userId)).size;
  const tiposMaterial = materialCounts.size;

  // Considera apenas coletas concluidas com duracao valida (conclusao depois do aceite).
  // Registros inconsistentes (ex.: dados de seed com conclusao anterior ao aceite)
  // sao ignorados para nao distorcer a media.
  const duracoesValidas = concluidas
    .filter((item) => item.dataConclusao)
    .map((item) => new Date(item.dataConclusao!).getTime() - new Date(item.dataAceite).getTime())
    .filter((ms) => ms > 0);
  const tempoMedioMs =
    duracoesValidas.length > 0
      ? duracoesValidas.reduce((total, ms) => total + ms, 0) / duracoesValidas.length
      : 0;

  const data: EmpresaDashboardData = {
    empresaNome: session!.user!.name ?? "Empresa",
    cnpj: company.cnpj,
    metrics: {
      novasSolicitacoes: solicitacoesDisponiveis.length,
      emAndamento: ativas.length,
      concluidasMes: concluidas.length,
      taxaConclusao,
      pendentesMais24h,
      cidadaosAtendidos,
      tiposMaterial,
      tempoMedioConclusao: formatDuracao(tempoMedioMs),
    },
    solicitacoes,
    materiaisContagem,
    coletasPorStatus,
    totalColetas,
    avaliacao: avaliacaoData,
  };

  return <EmpresaDashboardClient data={data} />;
}

function formatDuracao(ms: number): string {
  if (ms <= 0) return "—";
  const horas = ms / (1000 * 60 * 60);
  if (horas < 1) return `${Math.max(1, Math.round(ms / (1000 * 60)))} min`;
  if (horas < 24) return `${Math.round(horas)} h`;
  const dias = horas / 24;
  return `${dias < 10 ? dias.toFixed(1) : Math.round(dias)} dias`;
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
