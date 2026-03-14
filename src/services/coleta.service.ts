import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Gera um código de confirmação único para a coleta.
 */
function gerarCodigoConfirmacao(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Empresa aceita uma solicitação aprovada, criando uma Coleta.
 */
export async function aceitarSolicitacao(
  solicitacaoId: number,
  companyId: number
) {
  // Verifica se a solicitação já não foi aceita por outra empresa
  const existente = await prisma.coleta.findUnique({
    where: { solicitacaoId },
  });
  if (existente) throw new Error("Solicitação já foi aceita por outra empresa.");

  return prisma.coleta.create({
    data: {
      solicitacaoId,
      companyId,
      status: "aceita",
      codigoConfirmacao: gerarCodigoConfirmacao(),
    },
    include: { solicitacao: true, company: true },
  });
}

/**
 * Atualiza o status de uma coleta (somente a empresa responsável).
 */
export async function atualizarStatusColeta(
  coletaId: number,
  companyId: number,
  novoStatus: string
) {
  const coleta = await prisma.coleta.findFirst({
    where: { id: coletaId, companyId },
  });
  if (!coleta) throw new Error("Coleta não encontrada ou sem permissão.");

  const data: Record<string, unknown> = { status: novoStatus };
  if (novoStatus === "concluida") {
    data.dataConclusao = new Date();
  }

  return prisma.coleta.update({ where: { id: coletaId }, data });
}

/**
 * Lista todas as coletas de uma empresa.
 */
export async function listarColetasDaEmpresa(companyId: number) {
  return prisma.coleta.findMany({
    where: { companyId },
    include: {
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true, telefone: true } },
          material: true,
          imagens: true,
        },
      },
    },
    orderBy: { dataAceite: "desc" },
  });
}

/**
 * Busca detalhes completos de uma coleta.
 */
export async function buscarColetaPorId(
  coletaId: number,
  userId?: number,
  companyId?: number
) {
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: {
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true, telefone: true, endereco: true } },
          material: true,
          imagens: true,
        },
      },
      company: {
        include: { user: { select: { id: true, nome: true, email: true } } },
      },
      mensagens: {
        include: { remetente: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!coleta) return null;

  // Verifica se o usuário tem permissão de ver esta coleta
  if (userId && coleta.solicitacao.userId !== userId) return null;
  if (companyId && coleta.companyId !== companyId) return null;

  return coleta;
}
