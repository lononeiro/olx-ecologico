import { prisma } from "@/lib/prisma";

const MAX_SOLICITACAO_IMAGENS = 5;
const PRAZO_ANALISE_HORAS = 24;

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
export async function listarSolicitacoesDoUsuario(userId: number) {
  return prisma.solicitacaoColeta.findMany({
    where: { userId },
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
export async function listarSolicitacoesAprovadas() {
  return prisma.solicitacaoColeta.findMany({
    where: { aprovado: true, status: "aprovada", coleta: null },
    include: {
      user: { select: { id: true, nome: true, email: true, endereco: true } },
      material: true,
      imagens: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
