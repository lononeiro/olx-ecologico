import { prisma } from "@/lib/prisma";

/**
 * Verifica se o userId tem acesso à coleta (é o dono da solicitação
 * ou é o usuário vinculado à empresa que aceitou).
 * Retorna a coleta se autorizado, null caso contrário.
 */
export async function verificarAcessoColeta(coletaId: number, userId: number) {
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    select: {
      id: true,
      solicitacao: { select: { userId: true } },
      company:     { select: { userId: true } },
    },
  });

  if (!coleta) return null;

  const autorizado =
    coleta.solicitacao.userId === userId ||
    coleta.company.userId    === userId;

  return autorizado ? coleta : null;
}

/**
 * Lista mensagens de uma coleta.
 * Lança erro se o userId não tiver acesso.
 */
export async function listarMensagensColeta(coletaId: number, userId: number) {
  const acesso = await verificarAcessoColeta(coletaId, userId);
  if (!acesso) throw new Error("Acesso negado a esta conversa.");

  return prisma.mensagem.findMany({
    where: { coletaId },
    include: { remetente: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Envia uma mensagem no contexto de uma coleta.
 * Verifica se o remetente é o dono da solicitação ou a empresa.
 */
export async function enviarMensagem(
  coletaId: number,
  remetenteId: number,
  mensagem: string
) {
  const acesso = await verificarAcessoColeta(coletaId, remetenteId);
  if (!acesso) throw new Error("Sem permissão para enviar mensagem nesta coleta.");

  return prisma.mensagem.create({
    data: { coletaId, remetenteId, mensagem },
    include: { remetente: { select: { id: true, nome: true } } },
  });
}