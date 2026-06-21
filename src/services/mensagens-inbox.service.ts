import { prisma } from "@/lib/prisma";

export type InboxRole = "usuario" | "empresa";

export type InboxConversation = {
  id: string;
  dbId: number;
  type: "pre_accept" | "coleta";
  title: string;
  otherPartyName: string;
  material: string;
  status: string;
  statusLabel: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  messageApiPath: string;
  detailHref: string;
  canSend: boolean;
};

export type InboxMessage = {
  id: number;
  mensagem: string;
  createdAt: Date;
  remetente: { id: number; nome: string };
};

export async function listarInboxMensagens(userId: number, role: InboxRole) {
  const [preAccept, coletas] = await Promise.all([
    listarConversasPreAceite(userId, role),
    listarConversasColeta(userId, role),
  ]);

  return [...preAccept, ...coletas].sort((a, b) => {
    const left = a.lastMessageAt ?? a.createdAt;
    const right = b.lastMessageAt ?? b.createdAt;
    return right.getTime() - left.getTime();
  });
}

export async function buscarMensagensDaInbox(
  conversationId: string,
  userId: number,
  role: InboxRole
) {
  const parsed = parseInboxId(conversationId);
  if (!parsed) return null;

  if (parsed.type === "pre_accept") {
    const conversa = await prisma.conversaSolicitacao.findFirst({
      where: {
        id: parsed.dbId,
        ...(role === "empresa"
          ? { company: { userId } }
          : { solicitacao: { userId } }),
      },
      select: { id: true },
    });

    if (!conversa) return null;

    return prisma.mensagemPreAceite.findMany({
      where: { conversaId: parsed.dbId },
      include: { remetente: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  const coleta = await prisma.coleta.findFirst({
    where: {
      id: parsed.dbId,
      ...(role === "empresa"
        ? { company: { userId } }
        : { solicitacao: { userId } }),
    },
    select: { id: true },
  });

  if (!coleta) return null;

  return prisma.mensagem.findMany({
    where: { coletaId: parsed.dbId },
    include: { remetente: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" },
  });
}

function parseInboxId(id: string) {
  const [type, rawId] = id.split(":");
  const dbId = Number(rawId);

  if (!dbId || Number.isNaN(dbId)) return null;
  if (type === "pre_accept") return { type, dbId } as const;
  if (type === "coleta") return { type, dbId } as const;
  return null;
}

async function listarConversasPreAceite(userId: number, role: InboxRole) {
  const conversas = await prisma.conversaSolicitacao.findMany({
    where:
      role === "empresa"
        ? { company: { userId } }
        : { solicitacao: { userId } },
    include: {
      company: { include: { user: { select: { id: true, nome: true } } } },
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true } },
          material: true,
        },
      },
      mensagens: {
        include: { remetente: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return conversas.map((conversa): InboxConversation => {
    const last = conversa.mensagens[0] ?? null;
    const otherPartyName =
      role === "empresa" ? conversa.solicitacao.user.nome : conversa.company.user.nome;

    return {
      id: `pre_accept:${conversa.id}`,
      dbId: conversa.id,
      type: "pre_accept",
      title: conversa.solicitacao.titulo,
      otherPartyName,
      material: conversa.solicitacao.material.nome,
      status: conversa.status,
      statusLabel: getPreAcceptStatusLabel(conversa.status),
      lastMessage: last?.mensagem ?? null,
      lastMessageAt: last?.createdAt ?? null,
      createdAt: conversa.createdAt,
      messageApiPath: `/api/conversas-solicitacao/${conversa.id}/mensagens`,
      detailHref:
        role === "empresa"
          ? `/empresa/solicitacoes/${conversa.solicitacaoId}/conversa`
          : `/dashboard/solicitacoes/${conversa.solicitacaoId}`,
      canSend: conversa.status === "aberta",
    };
  });
}

async function listarConversasColeta(userId: number, role: InboxRole) {
  const coletas = await prisma.coleta.findMany({
    where:
      role === "empresa"
        ? { company: { userId } }
        : { solicitacao: { userId } },
    include: {
      company: { include: { user: { select: { id: true, nome: true } } } },
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true } },
          material: true,
        },
      },
      mensagens: {
        include: { remetente: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return coletas.map((coleta): InboxConversation => {
    const last = coleta.mensagens[0] ?? null;
    const otherPartyName =
      role === "empresa" ? coleta.solicitacao.user.nome : coleta.company.user.nome;

    return {
      id: `coleta:${coleta.id}`,
      dbId: coleta.id,
      type: "coleta",
      title: coleta.solicitacao.titulo,
      otherPartyName,
      material: coleta.solicitacao.material.nome,
      status: coleta.status,
      statusLabel: getColetaStatusLabel(coleta.status),
      lastMessage: last?.mensagem ?? null,
      lastMessageAt: last?.createdAt ?? null,
      createdAt: coleta.dataAceite,
      messageApiPath: `/api/mensagens/${coleta.id}`,
      detailHref:
        role === "empresa"
          ? `/empresa/coletas/${coleta.id}`
          : `/dashboard/solicitacoes/${coleta.solicitacaoId}`,
      canSend: true,
    };
  });
}

function getPreAcceptStatusLabel(status: string) {
  if (status === "aberta") return "Aberta";
  if (status === "convertida") return "Convertida";
  if (status === "encerrada") return "Encerrada";
  return status;
}

function getColetaStatusLabel(status: string) {
  if (status === "aceita") return "Aceita";
  if (status === "a_caminho") return "A caminho";
  if (status === "em_coleta") return "Em coleta";
  if (status === "concluida") return "Concluida";
  if (status === "cancelada") return "Cancelada";
  return status;
}
