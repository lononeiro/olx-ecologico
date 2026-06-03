import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function gerarCodigoConfirmacao(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function aceitarSolicitacao(
  solicitacaoId: number,
  companyId: number,
  dataPrevisaoColeta?: Date
) {
  return prisma.$transaction(async (tx) => {
    const solicitacao = await tx.solicitacaoColeta.findFirst({
      where: {
        id: solicitacaoId,
        aprovado: true,
        status: "aprovada",
        coleta: null,
      },
      select: { id: true },
    });
    if (!solicitacao) throw new Error("Solicitacao indisponivel para aceite.");

    const existente = await tx.coleta.findUnique({
      where: { solicitacaoId },
    });
    if (existente) throw new Error("Solicitacao ja foi aceita por outra empresa.");

    const data: {
      solicitacaoId: number;
      companyId: number;
      status: string;
      codigoConfirmacao: string;
      dataPrevisaoColeta?: Date;
    } = {
      solicitacaoId,
      companyId,
      status: "aceita",
      codigoConfirmacao: gerarCodigoConfirmacao(),
    };

    if (dataPrevisaoColeta) data.dataPrevisaoColeta = dataPrevisaoColeta;

    const coleta = await tx.coleta.create({
      data,
      include: { solicitacao: true, company: true },
    });

    await tx.conversaSolicitacao.updateMany({
      where: { solicitacaoId, companyId },
      data: { status: "convertida" },
    });

    await tx.conversaSolicitacao.updateMany({
      where: { solicitacaoId, companyId: { not: companyId } },
      data: { status: "encerrada" },
    });

    return coleta;
  });
}

export async function atualizarStatusColeta(
  coletaId: number,
  companyId: number,
  novoStatus: string
) {
  const coleta = await prisma.coleta.findFirst({
    where: { id: coletaId, companyId },
  });
  if (!coleta) throw new Error("Coleta nao encontrada ou sem permissao.");

  const data: Record<string, unknown> = { status: novoStatus };
  if (novoStatus === "concluida") {
    data.dataConclusao = new Date();
  }

  return prisma.coleta.update({ where: { id: coletaId }, data });
}

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

export async function buscarColetaPorId(
  coletaId: number,
  userId?: number,
  companyId?: number,
  options: { includeMensagens?: boolean } = {}
) {
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: {
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true, telefone: true } },
          material: true,
          imagens: true,
        },
      },
      company: {
        include: { user: { select: { id: true, nome: true, email: true } } },
      },
      ...(options.includeMensagens
        ? {
            mensagens: {
              include: { remetente: { select: { id: true, nome: true } } },
              orderBy: { createdAt: "asc" as const },
            },
          }
        : {}),
    },
  });

  if (!coleta) return null;
  if (userId && coleta.solicitacao.userId !== userId) return null;
  if (companyId && coleta.companyId !== companyId) return null;

  return coleta;
}
