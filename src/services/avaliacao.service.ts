import { prisma } from "@/lib/prisma";
import { notificarAvaliacaoRecebida } from "@/services/notificacao.service";

export async function criarAvaliacao(
  coletaId: number,
  autorId: number,
  nota: number,
  comentario?: string
) {
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: {
      solicitacao: true,
      company: { select: { userId: true } },
    },
  });

  if (!coleta) throw new Error("Coleta não encontrada.");
  if (coleta.solicitacao.userId !== autorId) throw new Error("Sem permissão para avaliar esta coleta.");
  if (coleta.status !== "concluida") throw new Error("A coleta precisa estar concluída para ser avaliada.");

  const existente = await prisma.avaliacao.findUnique({ where: { coletaId } });
  if (existente) throw new Error("Esta coleta já foi avaliada.");

  const avaliacao = await prisma.avaliacao.create({
    data: { coletaId, autorId, nota, comentario },
  });

  await notificarAvaliacaoRecebida({
    empresaUserId: coleta.company.userId,
    nota,
    solicitacaoTitulo: coleta.solicitacao.titulo,
  });

  return avaliacao;
}

export async function buscarAvaliacaoDaColeta(coletaId: number) {
  return prisma.avaliacao.findUnique({ where: { coletaId } });
}

export async function calcularMediaEmpresa(companyId: number) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { coleta: { companyId } },
    select: { nota: true },
  });

  const total = avaliacoes.length;
  const media = total > 0
    ? Math.round((avaliacoes.reduce((sum, a) => sum + a.nota, 0) / total) * 10) / 10
    : 0;

  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const a of avaliacoes) {
    distribuicao[a.nota] = (distribuicao[a.nota] ?? 0) + 1;
  }

  return { media, total, distribuicao };
}

export async function listarAvaliacoesDaEmpresa(companyId: number) {
  const coletas = await prisma.coleta.findMany({
    where: {
      companyId,
      status: "concluida",
    },
    include: {
      avaliacao: {
        include: {
          autor: {
            select: { id: true, nome: true },
          },
        },
      },
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true } },
          material: true,
        },
      },
    },
    orderBy: [
      { dataConclusao: "desc" },
      { dataAceite: "desc" },
    ],
  });

  const totalFinalizadas = coletas.length;
  const avaliadas = coletas.filter((coleta) => coleta.avaliacao);
  const totalAvaliacoes = avaliadas.length;
  const media = totalAvaliacoes > 0
    ? Math.round((avaliadas.reduce((sum, coleta) => sum + (coleta.avaliacao?.nota ?? 0), 0) / totalAvaliacoes) * 10) / 10
    : 0;

  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const coleta of avaliadas) {
    const nota = coleta.avaliacao!.nota;
    distribuicao[nota] = (distribuicao[nota] ?? 0) + 1;
  }

  return {
    resumo: {
      media,
      totalAvaliacoes,
      totalFinalizadas,
      aguardandoAvaliacao: totalFinalizadas - totalAvaliacoes,
      distribuicao,
    },
    coletas: coletas.map((coleta) => ({
      id: coleta.id,
      status: coleta.status,
      dataAceite: coleta.dataAceite,
      dataConclusao: coleta.dataConclusao,
      solicitacao: {
        id: coleta.solicitacao.id,
        titulo: coleta.solicitacao.titulo,
        descricao: coleta.solicitacao.descricao,
        quantidade: coleta.solicitacao.quantidade,
        endereco: coleta.solicitacao.endereco,
        materialNome: coleta.solicitacao.material.nome,
        solicitanteNome: coleta.solicitacao.user.nome,
      },
      avaliacao: coleta.avaliacao
        ? {
            id: coleta.avaliacao.id,
            nota: coleta.avaliacao.nota,
            comentario: coleta.avaliacao.comentario,
            createdAt: coleta.avaliacao.createdAt,
            autorNome: coleta.avaliacao.autor.nome,
          }
        : null,
    })),
  };
}
