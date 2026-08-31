import { prisma } from "@/lib/prisma";
import {
  notificarAvaliacaoRecebida,
  notificarAvaliacaoUsuario,
} from "@/services/notificacao.service";

export type TipoAvaliacao = "usuario_para_empresa" | "empresa_para_usuario";

export async function criarAvaliacao(
  coletaId: number,
  autorId: number,
  nota: number,
  comentario: string | undefined,
  tipo: TipoAvaliacao
) {
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: {
      solicitacao: true,
      company: { select: { userId: true } },
    },
  });

  if (!coleta) throw new Error("Coleta não encontrada.");
  if (coleta.status !== "concluida") throw new Error("A coleta precisa estar concluída para ser avaliada.");

  // Valida se o autor tem o papel certo para a direção informada.
  if (tipo === "usuario_para_empresa" && coleta.solicitacao.userId !== autorId) {
    throw new Error("Sem permissão para avaliar esta coleta.");
  }
  if (tipo === "empresa_para_usuario" && coleta.company.userId !== autorId) {
    throw new Error("Sem permissão para avaliar esta coleta.");
  }

  const existente = await prisma.avaliacao.findUnique({
    where: { coletaId_tipo: { coletaId, tipo } },
  });
  if (existente) throw new Error("Esta coleta já foi avaliada.");

  const avaliacao = await prisma.avaliacao.create({
    data: { coletaId, autorId, nota, comentario, tipo },
  });

  if (tipo === "usuario_para_empresa") {
    await notificarAvaliacaoRecebida({
      empresaUserId: coleta.company.userId,
      nota,
      solicitacaoTitulo: coleta.solicitacao.titulo,
    });
  } else {
    await notificarAvaliacaoUsuario({
      usuarioUserId: coleta.solicitacao.userId,
      nota,
      solicitacaoId: coleta.solicitacao.id,
      solicitacaoTitulo: coleta.solicitacao.titulo,
    });
  }

  return avaliacao;
}

export async function buscarAvaliacaoDaColeta(
  coletaId: number,
  tipo: TipoAvaliacao = "usuario_para_empresa"
) {
  return prisma.avaliacao.findUnique({
    where: { coletaId_tipo: { coletaId, tipo } },
  });
}

export async function calcularMediaEmpresa(companyId: number) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { coleta: { companyId }, tipo: "usuario_para_empresa" },
    select: { nota: true },
  });

  const total = avaliacoes.length;
  const media = total > 0
    ? Math.round((avaliacoes.reduce((sum, a) => sum + a.nota, 0) / total) * 10) / 10
    : 0;

  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const a of avaliacoes) {
    distribuicao[a.nota] = (distribuicao[a.nota] ?? 0) + 1;
  }

  return { media, total, distribuicao };
}

/** Média das notas que um cidadão recebeu das empresas (empresa → usuário). */
export async function calcularMediaUsuario(userId: number) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { tipo: "empresa_para_usuario", coleta: { solicitacao: { userId } } },
    select: { nota: true },
  });

  const total = avaliacoes.length;
  const media = total > 0
    ? Math.round((avaliacoes.reduce((sum, a) => sum + a.nota, 0) / total) * 10) / 10
    : 0;

  return { media, total };
}

/**
 * Versão em lote de calcularMediaUsuario, para evitar N+1 ao listar
 * solicitações disponíveis. Sempre retorna uma entrada por userId pedido.
 */
export async function calcularMediasUsuarios(
  userIds: number[]
): Promise<Map<number, { media: number; total: number }>> {
  const resultado = new Map<number, { media: number; total: number }>();
  const unicos = [...new Set(userIds)];
  if (unicos.length === 0) return resultado;

  const avaliacoes = await prisma.avaliacao.findMany({
    where: {
      tipo: "empresa_para_usuario",
      coleta: { solicitacao: { userId: { in: unicos } } },
    },
    select: {
      nota: true,
      coleta: { select: { solicitacao: { select: { userId: true } } } },
    },
  });

  const acumulado = new Map<number, { soma: number; total: number }>();
  for (const a of avaliacoes) {
    const uid = a.coleta.solicitacao.userId;
    const atual = acumulado.get(uid) ?? { soma: 0, total: 0 };
    atual.soma += a.nota;
    atual.total += 1;
    acumulado.set(uid, atual);
  }

  for (const uid of unicos) {
    const atual = acumulado.get(uid);
    resultado.set(
      uid,
      atual
        ? { media: Math.round((atual.soma / atual.total) * 10) / 10, total: atual.total }
        : { media: 0, total: 0 }
    );
  }

  return resultado;
}

export async function listarAvaliacoesDaEmpresa(companyId: number) {
  const coletas = await prisma.coleta.findMany({
    where: {
      companyId,
      status: "concluida",
    },
    include: {
      avaliacoes: {
        where: { tipo: "usuario_para_empresa" },
        include: {
          autor: {
            select: { id: true, nome: true },
          },
        },
      },
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true } },
          material: true,
        },
      },
    },
    orderBy: [
      { dataConclusao: "desc" },
      { dataAceite: "desc" },
    ],
  });

  // A coleta agora tem 0..N avaliações; aqui só interessa a recebida pela empresa.
  const comAvaliacao = coletas.map((coleta) => ({
    coleta,
    avaliacaoRecebida: coleta.avaliacoes[0] ?? null,
  }));

  const totalFinalizadas = coletas.length;
  const avaliadas = comAvaliacao.filter((item) => item.avaliacaoRecebida);
  const totalAvaliacoes = avaliadas.length;
  const media = totalAvaliacoes > 0
    ? Math.round((avaliadas.reduce((sum, item) => sum + (item.avaliacaoRecebida?.nota ?? 0), 0) / totalAvaliacoes) * 10) / 10
    : 0;

  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const item of avaliadas) {
    const nota = item.avaliacaoRecebida!.nota;
    distribuicao[nota] = (distribuicao[nota] ?? 0) + 1;
  }

  return {
    resumo: {
      media,
      totalAvaliacoes,
      totalFinalizadas,
      aguardandoAvaliacao: totalFinalizadas - totalAvaliacoes,
      distribuicao,
    },
    coletas: comAvaliacao.map(({ coleta, avaliacaoRecebida }) => ({
      id: coleta.id,
      status: coleta.status,
      dataAceite: coleta.dataAceite,
      dataConclusao: coleta.dataConclusao,
      solicitacao: {
        id: coleta.solicitacao.id,
        titulo: coleta.solicitacao.titulo,
        descricao: coleta.solicitacao.descricao,
        quantidade: coleta.solicitacao.quantidade,
        endereco: coleta.solicitacao.endereco,
        materialNome: coleta.solicitacao.material.nome,
        solicitanteNome: coleta.solicitacao.user.nome,
      },
      avaliacao: avaliacaoRecebida
        ? {
            id: avaliacaoRecebida.id,
            nota: avaliacaoRecebida.nota,
            comentario: avaliacaoRecebida.comentario,
            createdAt: avaliacaoRecebida.createdAt,
            autorNome: avaliacaoRecebida.autor.nome,
          }
        : null,
    })),
  };
}
