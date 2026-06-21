import { prisma } from "@/lib/prisma";
import { toEmpresaSolicitacaoDisponivelDTO } from "@/lib/privacy";
import { notificarNovaMensagem } from "@/services/notificacao.service";

const MENSAGEM_MAX_LENGTH = 1000;

function normalizarMensagem(mensagem: string) {
  const text = mensagem.trim();
  if (!text) throw new Error("Digite uma mensagem antes de enviar.");
  if (text.length > MENSAGEM_MAX_LENGTH) {
    throw new Error(`A mensagem deve ter no máximo ${MENSAGEM_MAX_LENGTH} caracteres.`);
  }
  return text;
}

async function buscarCompanyPorUsuario(userId: number) {
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) throw new Error("Empresa não encontrada.");
  return company;
}

export async function obterOuCriarConversaEmpresa(
  solicitacaoId: number,
  empresaUserId: number
) {
  const company = await buscarCompanyPorUsuario(empresaUserId);

  const solicitacao = await prisma.solicitacaoColeta.findFirst({
    where: {
      id: solicitacaoId,
      aprovado: true,
      status: "aprovada",
      coleta: null,
    },
    select: { id: true },
  });

  if (!solicitacao) {
    throw new Error("Solicitação indisponível para conversa.");
  }

  const conversa = await prisma.conversaSolicitacao.upsert({
    where: {
      solicitacaoId_companyId: {
        solicitacaoId,
        companyId: company.id,
      },
    },
    create: {
      solicitacaoId,
      companyId: company.id,
      status: "aberta",
    },
    update: {
      status: "aberta",
    },
    include: conversaInclude,
  });

  return {
    ...conversa,
    solicitacao: toEmpresaSolicitacaoDisponivelDTO(conversa.solicitacao),
  };
}

export async function listarConversasDaSolicitacaoUsuario(
  solicitacaoId: number,
  userId: number
) {
  const solicitacao = await prisma.solicitacaoColeta.findFirst({
    where: { id: solicitacaoId, userId },
    select: { id: true },
  });

  if (!solicitacao) throw new Error("Solicitação não encontrada ou sem permissão.");

  return prisma.conversaSolicitacao.findMany({
    where: { solicitacaoId },
    include: {
      company: {
        include: { user: { select: { id: true, nome: true } } },
      },
      mensagens: {
        include: { remetente: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function buscarConversaAutorizada(conversaId: number, userId: number) {
  const conversa = await prisma.conversaSolicitacao.findUnique({
    where: { id: conversaId },
    include: {
      solicitacao: {
        select: {
          id: true,
          userId: true,
          titulo: true,
          coleta: { select: { id: true, companyId: true } },
        },
      },
      company: { select: { id: true, userId: true } },
    },
  });

  if (!conversa) return null;

  const autorizado =
    conversa.solicitacao.userId === userId || conversa.company.userId === userId;

  return autorizado ? conversa : null;
}

export async function listarMensagensConversaSolicitacao(
  conversaId: number,
  userId: number,
  options: { sinceId?: number } = {}
) {
  const conversa = await buscarConversaAutorizada(conversaId, userId);
  if (!conversa) throw new Error("Acesso negado a esta conversa.");

  return prisma.mensagemPreAceite.findMany({
    where: {
      conversaId,
      ...(options.sinceId ? { id: { gt: options.sinceId } } : {}),
    },
    include: { remetente: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function enviarMensagemConversaSolicitacao(
  conversaId: number,
  remetenteId: number,
  mensagem: string
) {
  const text = normalizarMensagem(mensagem);
  const conversa = await buscarConversaAutorizada(conversaId, remetenteId);

  if (!conversa) {
    throw new Error("Sem permissão para enviar mensagem nesta conversa.");
  }

  if (conversa.status !== "aberta") {
    throw new Error("Esta conversa não está mais aberta.");
  }

  if (conversa.solicitacao.coleta) {
    throw new Error("Esta solicitação já foi aceita por uma empresa.");
  }

  const novaMensagem = await prisma.mensagemPreAceite.create({
    data: { conversaId, remetenteId, mensagem: text },
    include: { remetente: { select: { id: true, nome: true } } },
  });

  const remetenteEhSolicitante = conversa.solicitacao.userId === remetenteId;
  await notificarNovaMensagem({
    destinatarioId: remetenteEhSolicitante
      ? conversa.company.userId
      : conversa.solicitacao.userId,
    destinatarioRole: remetenteEhSolicitante ? "empresa" : "usuario",
    remetenteNome: novaMensagem.remetente.nome,
    assunto: conversa.solicitacao.titulo,
    previa: text,
  });

  return novaMensagem;
}

const conversaInclude = {
  company: {
    include: { user: { select: { id: true, nome: true } } },
  },
  solicitacao: {
    include: {
      material: true,
      imagens: true,
    },
  },
  mensagens: {
    include: { remetente: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};
