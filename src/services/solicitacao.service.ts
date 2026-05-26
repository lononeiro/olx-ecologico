import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const MAX_SOLICITACAO_IMAGENS = 5;
const PRAZO_ANALISE_HORAS = 24;

export type FiltrosSolicitacao = {
  status?: string;
  materialId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  q?: string;
};

export function getAdminSolicitacaoScope(now = new Date()) {
  const limite = new Date(now.getTime() - PRAZO_ANALISE_HORAS * 60 * 60 * 1000);

  return {
    OR: [
      { status: "rejeitada" },
      { status: "aprovada", aprovado: true, coleta: null },
      { status: "pendente", aprovado: false, createdAt: { lte: limite } },
    ],
  };
}

/**
 * Cria uma nova solicitacao de coleta para o usuario autenticado.
 */
export async function criarSolicitacao(
  userId: number,
  data: {
    titulo: string;
    descricao: string;
    quantidade: string;
    endereco: string;
    materialId: number;
    imagens?: string[];
  }
) {
  const imagens = Array.from(
    new Set(
      (data.imagens ?? [])
        .filter((url): url is string => typeof url === "string")
        .map((url) => url.trim())
        .filter(Boolean)
    )
  );

  if (imagens.length > MAX_SOLICITACAO_IMAGENS) {
    throw new Error(
      `Voce pode adicionar no maximo ${MAX_SOLICITACAO_IMAGENS} imagens por solicitacao.`
    );
  }

  const { imagens: _imagens, ...rest } = data;

  const solicitacao = await prisma.solicitacaoColeta.create({
    data: {
      ...rest,
      userId,
      status: "pendente",
      aprovado: false,
      imagens: imagens.length
        ? { create: imagens.map((url) => ({ url })) }
        : undefined,
    },
    include: { material: true, imagens: true },
  });

  return solicitacao;
}

/**
 * Lista todas as solicitacoes de um usuario especifico.
 */
export async function listarSolicitacoesDoUsuario(userId: number, filtros: FiltrosSolicitacao = {}) {
  const where: Prisma.SolicitacaoColetaWhereInput = {
    userId,
    ...(filtros.status    && { status: filtros.status }),
    ...(filtros.materialId && { materialId: filtros.materialId }),
    ...((filtros.dataInicio || filtros.dataFim) && {
      createdAt: {
        ...(filtros.dataInicio && { gte: filtros.dataInicio }),
        ...(filtros.dataFim    && { lte: filtros.dataFim    }),
      },
    }),
  };
  return prisma.solicitacaoColeta.findMany({
    where,
    include: {
      material: true,
      imagens: true,
      coleta: { include: { company: { include: { user: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retorna uma solicitacao pelo id, verificando permissao de acesso.
 */
export async function buscarSolicitacaoPorId(id: number, userId?: number) {
  const where = userId ? { id, userId } : { id };
  return prisma.solicitacaoColeta.findFirst({
    where,
    include: {
      user: { select: { id: true, nome: true, email: true, telefone: true } },
      material: true,
      imagens: true,
      coleta: {
        include: {
          company: {
            include: { user: { select: { id: true, nome: true, email: true } } },
          },
          mensagens: {
            include: { remetente: { select: { id: true, nome: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

/**
 * Lista todas as solicitacoes pendentes de aprovacao (acesso Admin).
 */
export async function listarSolicitacoesPendentes() {
  return prisma.solicitacaoColeta.findMany({
    where: { status: "pendente", aprovado: false },
    include: {
      user: { select: { id: true, nome: true, email: true } },
      material: true,
      imagens: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listarSolicitacoesAdmin() {
  return prisma.solicitacaoColeta.findMany({
    where: getAdminSolicitacaoScope(),
    include: {
      user: { select: { id: true, nome: true, email: true } },
      material: true,
      imagens: true,
      coleta: {
        select: {
          id: true,
          status: true,
          dataAceite: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Aprova ou rejeita uma solicitacao (acesso Admin).
 */
export async function atualizarStatusSolicitacao(
  id: number,
  aprovado: boolean
) {
  return prisma.solicitacaoColeta.update({
    where: { id },
    data: {
      aprovado,
      status: aprovado ? "aprovada" : "rejeitada",
    },
  });
}

/**
 * Lista todas as solicitacoes aprovadas e disponiveis (sem coleta) - acesso Empresa.
 */
export async function listarSolicitacoesAprovadas(filtros: FiltrosSolicitacao = {}) {
  const where: Prisma.SolicitacaoColetaWhereInput = {
    aprovado: true,
    status: "aprovada",
    coleta: null,
    ...(filtros.materialId && { materialId: filtros.materialId }),
    ...((filtros.dataInicio || filtros.dataFim) && {
      createdAt: {
        ...(filtros.dataInicio && { gte: filtros.dataInicio }),
        ...(filtros.dataFim    && { lte: filtros.dataFim    }),
      },
    }),
    ...(filtros.q && {
      OR: [
        { titulo:   { contains: filtros.q, mode: "insensitive" } },
        { endereco: { contains: filtros.q, mode: "insensitive" } },
      ],
    }),
  };
  return prisma.solicitacaoColeta.findMany({
    where,
    include: {
      user: { select: { id: true, nome: true, email: true, endereco: true } },
      material: true,
      imagens: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Cancela uma solicitacao pelo proprio cidadao dono.
 */
export async function cancelarSolicitacao(solicitacaoId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const solicitacao = await tx.solicitacaoColeta.findFirst({
      where: { id: solicitacaoId, userId },
      include: { coleta: true },
    });

    if (!solicitacao) throw new Error("Solicitacao nao encontrada ou sem permissao.");
    if (solicitacao.status === "rejeitada" || solicitacao.status === "cancelada") {
      throw new Error("Solicitacao nao pode ser cancelada neste estado.");
    }
    if (
      solicitacao.coleta &&
      ["em_coleta", "concluida"].includes(solicitacao.coleta.status)
    ) {
      throw new Error("Nao e possivel cancelar: coleta ja em andamento avancado.");
    }

    let coletaCancelada = false;
    if (solicitacao.coleta && ["aceita", "a_caminho"].includes(solicitacao.coleta.status)) {
      await tx.coleta.update({
        where: { id: solicitacao.coleta.id },
        data: { status: "cancelada" },
      });
      coletaCancelada = true;
    }

    const updated = await tx.solicitacaoColeta.update({
      where: { id: solicitacaoId },
      data: { status: "cancelada" },
    });

    return { solicitacao: updated, coletaCancelada };
  });
}
