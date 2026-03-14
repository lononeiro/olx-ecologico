import { prisma } from "@/lib/prisma";

/**
 * Envia uma mensagem no contexto de uma coleta.
 * Verifica se o remetente é o usuário dono da solicitação ou a empresa.
 */
export async function enviarMensagem(
  coletaId: number,
  remetenteId: number,
  mensagem: string
) {
  // Verifica se o remetente tem acesso à coleta
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: {
      solicitacao: { select: { userId: true } },
      company: { select: { userId: true } },
    },
  });

  if (!coleta) throw new Error("Coleta não encontrada.");

  const autorizado =
    coleta.solicitacao.userId === remetenteId ||
    coleta.company.userId === remetenteId;

  if (!autorizado) throw new Error("Sem permissão para enviar mensagem nesta coleta.");

  return prisma.mensagem.create({
    data: { coletaId, remetenteId, mensagem },
    include: { remetente: { select: { id: true, nome: true } } },
  });
}

/**
 * Lista todas as mensagens de uma coleta.
 */
export async function listarMensagensColeta(coletaId: number) {
  return prisma.mensagem.findMany({
    where: { coletaId },
    include: { remetente: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" },
  });
}
