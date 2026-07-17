import { prisma } from "@/lib/prisma";
import {
  maskEmail,
  maskPhone,
  toAdminSolicitacaoListDTO,
  toEmpresaSolicitacaoDisponivelDTO,
} from "@/lib/privacy";
import type { Prisma } from "@prisma/client";
import { notificarSolicitacaoRemovida } from "@/services/notificacao.service";

const MAX_SOLICITACAO_IMAGENS = 5;

export type FiltrosSolicitacao = {
  status?: string;
  materialId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  q?: string;
};

/**
 * Cria uma nova solicitação de coleta para o usuário autenticado.
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
      `Você pode adicionar no máximo ${MAX_SOLICITACAO_IMAGENS} imagens por solicitação.`
    );
  }

  const { imagens: _imagens, ...rest } = data;

  const solicitacao = await prisma.solicitacaoColeta.create({
    data: {
      ...rest,
      userId,
      status: "aprovada",
      aprovado: true,
      imagens: imagens.length
        ? { create: imagens.map((url) => ({ url })) }
        : undefined,
    },
    include: { material: true, imagens: true },
  });

  return solicitacao;
}

/**
 * Lista todas as solicitações de um usuário específico.
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

const solicitacaoDetailInclude = {
  user: { select: { id: true, nome: true, email: true, telefone: true } },
  material: true,
  imagens: true,
  coleta: {
    include: {
      company: {
        include: { user: { select: { id: true, nome: true, email: true } } },
      },
    },
  },
} satisfies Prisma.SolicitacaoColetaInclude;

export async function buscarSolicitacaoUsuarioDTO(id: number, userId: number) {
  return prisma.solicitacaoColeta.findFirst({
    where: { id, userId },
    include: solicitacaoDetailInclude,
  });
}

export async function buscarSolicitacaoAdminDetailDTO(id: number) {
  const solicitacao = await prisma.solicitacaoColeta.findFirst({
    where: { id },
    include: solicitacaoDetailInclude,
  });

  if (!solicitacao) return null;

  return {
    ...solicitacao,
    user: {
      ...solicitacao.user,
      email: maskEmail(solicitacao.user.email),
      telefone: maskPhone(solicitacao.user.telefone),
    },
  };
}

export async function buscarSolicitacaoEmpresaDTO(id: number, companyId: number) {
  const solicitacao = await prisma.solicitacaoColeta.findFirst({
    where: {
      id,
      OR: [
        { aprovado: true, status: "aprovada", coleta: null },
        { coleta: { companyId } },
      ],
    },
    include: {
      user: { select: { id: true, nome: true, email: true, telefone: true } },
      material: true,
      imagens: true,
      coleta: {
        select: {
          id: true,
          companyId: true,
          status: true,
          dataAceite: true,
          dataPrevisaoColeta: true,
          dataConclusao: true,
          company: {
            include: { user: { select: { id: true, nome: true, email: true } } },
          },
        },
      },
    },
  });

  if (!solicitacao) return null;
  if (!solicitacao.coleta) return toEmpresaSolicitacaoDisponivelDTO(solicitacao);

  return solicitacao;
}

/**
 * Retorna uma solicitacao pelo id, verificando permissao de acesso.
 * Mantido para chamadas internas legadas. Não inclui chat.
 */
export async function buscarSolicitacaoPorId(id: number, userId?: number) {
  return prisma.solicitacaoColeta.findFirst({
    where: userId ? { id, userId } : { id },
    include: {
      user: { select: { id: true, nome: true, email: true, telefone: true } },
      material: true,
      imagens: true,
      coleta: {
        include: {
          company: {
            include: { user: { select: { id: true, nome: true, email: true } } },
          },
        },
      },
    },
  });
}

/**
 * Lista solicitações recém-criadas para o painel de gestão do Admin.
 */
export async function listarSolicitacoesRecentes(limit = 10) {
  const solicitacoes = await prisma.solicitacaoColeta.findMany({
    where: { status: "aprovada" },
    include: {
      material: true,
      imagens: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return solicitacoes.map(toAdminSolicitacaoListDTO);
}

/**
 * Lista todas as solicitacoes para gestão (acesso Admin).
 */
export async function listarSolicitacoesAdmin() {
  const solicitacoes = await prisma.solicitacaoColeta.findMany({
    include: {
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

  return solicitacoes.map(toAdminSolicitacaoListDTO);
}

/**
 * Remove (moderação reativa) uma solicitacao do ar (acesso Admin).
 * A solicitação já nasce aprovada; isso é usada quando o admin identifica abuso.
 */
export async function removerSolicitacao(id: number) {
  const solicitacao = await prisma.solicitacaoColeta.update({
    where: { id },
    data: {
      aprovado: false,
      status: "removida",
    },
  });

  await notificarSolicitacaoRemovida({
    userId: solicitacao.userId,
    solicitacaoId: solicitacao.id,
    titulo: solicitacao.titulo,
  });

  return solicitacao;
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
  const solicitacoes = await prisma.solicitacaoColeta.findMany({
    where,
    include: {
      material: true,
      imagens: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return solicitacoes.map(toEmpresaSolicitacaoDisponivelDTO);
}

/**
 * Cancela uma solicitação pelo próprio cidadão dono.
 */
export async function cancelarSolicitacao(solicitacaoId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const solicitacao = await tx.solicitacaoColeta.findFirst({
      where: { id: solicitacaoId, userId },
      include: { coleta: true },
    });

    if (!solicitacao) throw new Error("Solicitação não encontrada ou sem permissão.");
    if (["rejeitada", "cancelada", "removida"].includes(solicitacao.status)) {
      throw new Error("Solicitação não pode ser cancelada neste estado.");
    }
    if (
      solicitacao.coleta &&
      ["em_coleta", "concluida"].includes(solicitacao.coleta.status)
    ) {
      throw new Error("Não é possível cancelar: coleta já em andamento avançado.");
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
