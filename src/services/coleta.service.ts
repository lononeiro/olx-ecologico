import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  notificarColetaAceita,
  notificarColetaStatus,
} from "@/services/notificacao.service";

function gerarCodigoConfirmacao(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function aceitarSolicitacao(
  solicitacaoId: number,
  companyId: number,
  dataPrevisaoColeta?: Date
) {
  const coleta = await prisma.$transaction(async (tx) => {
    const solicitacao = await tx.solicitacaoColeta.findFirst({
      where: {
        id: solicitacaoId,
        aprovado: true,
        status: "aprovada",
        coleta: null,
      },
      select: { id: true },
    });
    if (!solicitacao) throw new Error("Solicitação indisponível para aceite.");

    const existente = await tx.coleta.findUnique({
      where: { solicitacaoId },
    });
    if (existente) throw new Error("Solicitação já foi aceita por outra empresa.");

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

    const novaColeta = await tx.coleta.create({
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

    return novaColeta;
  });

  const empresa = await prisma.company.findUnique({
    where: { id: coleta.companyId },
    select: { user: { select: { nome: true } } },
  });

  await notificarColetaAceita({
    userId: coleta.solicitacao.userId,
    solicitacaoId: coleta.solicitacaoId,
    titulo: coleta.solicitacao.titulo,
    empresaNome: empresa?.user.nome ?? "A empresa coletora",
  });

  return coleta;
}

export async function atualizarStatusColeta(
  coletaId: number,
  companyId: number,
  novoStatus: string
) {
  const coleta = await prisma.coleta.findFirst({
    where: { id: coletaId, companyId },
    include: {
      solicitacao: { select: { id: true, userId: true, titulo: true } },
    },
  });
  if (!coleta) throw new Error("Coleta não encontrada ou sem permissão.");

  // Cancelar devolve a solicitação para a pool: como a disponibilidade depende
  // de `coleta: null`, apagamos o registro de coleta (e o que depende dele) e
  // reabrimos as conversas pré-aceite daquela solicitação.
  if (novoStatus === "cancelada") {
    await prisma.$transaction(async (tx) => {
      await tx.avaliacao.deleteMany({ where: { coletaId } });
      await tx.mensagem.deleteMany({ where: { coletaId } });
      await tx.coleta.delete({ where: { id: coletaId } });
      await tx.conversaSolicitacao.updateMany({
        where: { solicitacaoId: coleta.solicitacao.id },
        data: { status: "aberta" },
      });
    });

    await notificarColetaStatus({
      userId: coleta.solicitacao.userId,
      solicitacaoId: coleta.solicitacao.id,
      titulo: coleta.solicitacao.titulo,
      status: "cancelada",
    });

    // A coleta deixou de existir; devolvemos os dados só para a resposta HTTP.
    return { ...coleta, status: "cancelada", dataConclusao: null };
  }

  const data: Record<string, unknown> = { status: novoStatus };
  if (novoStatus === "concluida") {
    data.dataConclusao = new Date();
  }

  const atualizada = await prisma.coleta.update({ where: { id: coletaId }, data });

  await notificarColetaStatus({
    userId: coleta.solicitacao.userId,
    solicitacaoId: coleta.solicitacao.id,
    titulo: coleta.solicitacao.titulo,
    status: novoStatus,
  });

  return atualizada;
}

export async function listarColetasDaEmpresa(companyId: number) {
  const coletas = await prisma.coleta.findMany({
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

  // Coletas em andamento (não concluídas/canceladas) aparecem antes das
  // finalizadas; dentro de cada grupo mantém a ordem por dataAceite desc.
  const isFinalizada = (status: string) =>
    status === "concluida" || status === "cancelada";
  const ordenadas = coletas.sort(
    (a, b) => Number(isFinalizada(a.status)) - Number(isFinalizada(b.status))
  );

  // A empresa não recebe o código de confirmação do solicitante (ver
  // buscarColetaPorId): ele deve ser informado pelo cliente na coleta.
  return ordenadas.map(({ codigoConfirmacao: _codigo, ...rest }) => rest);
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
              include: { remetente: { select: { id: true, nome: true, avatarUrl: true } } },
              orderBy: { createdAt: "asc" as const },
            },
          }
        : {}),
    },
  });

  if (!coleta) return null;
  if (userId && coleta.solicitacao.userId !== userId) return null;
  if (companyId && coleta.companyId !== companyId) return null;

  // O código de confirmação pertence ao solicitante: a empresa deve pedi-lo ao
  // cliente no momento da coleta, então nunca é exposto no acesso da empresa.
  if (companyId && !userId) {
    const { codigoConfirmacao: _codigo, ...semCodigo } = coleta;
    return semCodigo;
  }

  return coleta;
}
