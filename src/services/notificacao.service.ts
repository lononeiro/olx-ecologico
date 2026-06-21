import { prisma } from "@/lib/prisma";

export type NotificacaoTipo =
  | "solicitacao_aprovada"
  | "solicitacao_rejeitada"
  | "coleta_aceita"
  | "coleta_status"
  | "nova_mensagem"
  | "avaliacao_recebida";

export type DestinatarioRole = "usuario" | "empresa";

const LISTA_LIMITE_PADRAO = 30;

type CriarNotificacaoInput = {
  userId: number;
  tipo: NotificacaoTipo;
  titulo: string;
  descricao: string;
  href?: string | null;
};

function truncar(texto: string, max = 80) {
  const limpo = texto.trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1)}…` : limpo;
}

/**
 * Cria uma notificação. É "best-effort": qualquer falha é registrada e
 * engolida para nunca quebrar o fluxo principal que disparou o evento.
 */
export async function criarNotificacao(input: CriarNotificacaoInput) {
  try {
    return await prisma.notificacao.create({
      data: {
        userId: input.userId,
        tipo: input.tipo,
        titulo: input.titulo,
        descricao: input.descricao,
        href: input.href ?? null,
      },
    });
  } catch (err) {
    console.error("[notificacao] falha ao criar notificação:", err);
    return null;
  }
}

export async function listarNotificacoes(
  userId: number,
  options: { limit?: number } = {}
) {
  return prisma.notificacao.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: options.limit ?? LISTA_LIMITE_PADRAO,
  });
}

export async function contarNaoLidas(userId: number) {
  return prisma.notificacao.count({ where: { userId, lida: false } });
}

/** Notificações com id maior que `sinceId` — usada pelo stream SSE. */
export async function buscarNotificacoesDesde(userId: number, sinceId: number) {
  return prisma.notificacao.findMany({
    where: { userId, id: { gt: sinceId } },
    orderBy: { id: "asc" },
  });
}

/** Maior id de notificação do usuário (ponto de partida do stream). */
export async function ultimaNotificacaoId(userId: number) {
  const ultima = await prisma.notificacao.findFirst({
    where: { userId },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  return ultima?.id ?? 0;
}

export async function marcarComoLida(id: number, userId: number) {
  const result = await prisma.notificacao.updateMany({
    where: { id, userId },
    data: { lida: true },
  });
  return result.count > 0;
}

export async function marcarTodasComoLidas(userId: number) {
  const result = await prisma.notificacao.updateMany({
    where: { userId, lida: false },
    data: { lida: true },
  });
  return result.count;
}

// ---------------------------------------------------------------------------
// Helpers por evento — centralizam título/descrição/href de cada notificação.
// ---------------------------------------------------------------------------

export function notificarSolicitacaoAvaliada(params: {
  userId: number;
  solicitacaoId: number;
  titulo: string;
  aprovado: boolean;
}) {
  return criarNotificacao({
    userId: params.userId,
    tipo: params.aprovado ? "solicitacao_aprovada" : "solicitacao_rejeitada",
    titulo: params.aprovado ? "Solicitação aprovada" : "Solicitação rejeitada",
    descricao: params.aprovado
      ? `Sua solicitação "${params.titulo}" foi aprovada e já está disponível para as empresas coletoras.`
      : `Sua solicitação "${params.titulo}" foi rejeitada pela administração.`,
    href: `/dashboard/solicitacoes/${params.solicitacaoId}`,
  });
}

export function notificarColetaAceita(params: {
  userId: number;
  solicitacaoId: number;
  titulo: string;
  empresaNome: string;
}) {
  return criarNotificacao({
    userId: params.userId,
    tipo: "coleta_aceita",
    titulo: "Coleta aceita",
    descricao: `${params.empresaNome} aceitou a coleta de "${params.titulo}".`,
    href: `/dashboard/solicitacoes/${params.solicitacaoId}`,
  });
}

const COLETA_STATUS_LABEL: Record<string, string> = {
  aceita: "foi aceita",
  a_caminho: "está a caminho",
  em_coleta: "está em coleta",
  concluida: "foi concluída",
  cancelada: "foi cancelada",
};

export function notificarColetaStatus(params: {
  userId: number;
  solicitacaoId: number;
  titulo: string;
  status: string;
}) {
  const label = COLETA_STATUS_LABEL[params.status] ?? `mudou para ${params.status}`;
  return criarNotificacao({
    userId: params.userId,
    tipo: "coleta_status",
    titulo: "Atualização da coleta",
    descricao: `A coleta de "${params.titulo}" ${label}.`,
    href: `/dashboard/solicitacoes/${params.solicitacaoId}`,
  });
}

export function notificarNovaMensagem(params: {
  destinatarioId: number;
  destinatarioRole: DestinatarioRole;
  remetenteNome: string;
  assunto: string;
  previa: string;
}) {
  return criarNotificacao({
    userId: params.destinatarioId,
    tipo: "nova_mensagem",
    titulo: `Nova mensagem de ${params.remetenteNome}`,
    descricao: `${params.assunto}: ${truncar(params.previa, 60)}`,
    href:
      params.destinatarioRole === "empresa"
        ? "/empresa/mensagens"
        : "/dashboard/mensagens",
  });
}

export function notificarAvaliacaoRecebida(params: {
  empresaUserId: number;
  nota: number;
  solicitacaoTitulo: string;
}) {
  return criarNotificacao({
    userId: params.empresaUserId,
    tipo: "avaliacao_recebida",
    titulo: "Nova avaliação recebida",
    descricao: `Você recebeu ${params.nota}★ pela coleta de "${params.solicitacaoTitulo}".`,
    href: "/empresa/avaliacoes",
  });
}
