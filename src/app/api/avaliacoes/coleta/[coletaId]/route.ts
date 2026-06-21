import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { buscarAvaliacaoDaColeta } from "@/services/avaliacao.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { coletaId: string } }
) {
  const { session, error } = await autorizarRota(["usuario"]);
  if (error) return error;

  const coletaId = Number(params.coletaId);
  if (isNaN(coletaId)) return NextResponse.json({ error: "coletaId inválido" }, { status: 400 });

  const userId = getUserId(session!);
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: { solicitacao: { select: { userId: true } } },
  });

  if (!coleta || coleta.solicitacao.userId !== userId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const avaliacao = await buscarAvaliacaoDaColeta(coletaId);
  return NextResponse.json(avaliacao ?? null);
}
