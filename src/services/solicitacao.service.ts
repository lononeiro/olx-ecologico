import { prisma } from "@/lib/prisma";

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
  const { imagens, ...rest } = data;

  const solicitacao = await prisma.solicitacaoColeta.create({
    data: {
      ...rest,
      userId,
      status: "pendente",
      aprovado: false,
      imagens: imagens?.length
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
 * Retorna uma solicitação pelo id, verificando permissão de acesso.
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
          company: { include: { user: { select: { id: true, nome: true, email: true } } } },
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
 * Lista todas as solicitações pendentes de aprovação (acesso Admin).
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

/**
 * Aprova ou rejeita uma solicitação (acesso Admin).
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
 * Lista todas as solicitações aprovadas e disponíveis (sem coleta) — acesso Empresa.
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
