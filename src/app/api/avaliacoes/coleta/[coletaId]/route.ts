import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { buscarAvaliacaoDaColeta } from "@/services/avaliacao.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coletaId: string }> }
) {
  const { session, error } = await autorizarRota(["usuario", "empresa"]);
  if (error) return error;

  const coletaId = Number((await params).coletaId);
  if (isNaN(coletaId)) return NextResponse.json({ error: "coletaId inválido" }, { status: 400 });

  const userId = getUserId(session!);
  const role = (session!.user as any).role as string;
  const coleta = await prisma.coleta.findUnique({
    where: { id: coletaId },
    include: {
      solicitacao: { select: { userId: true } },
      company: { select: { userId: true } },
    },
  });

  if (!coleta) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Cada papel só consulta a direção de avaliação que ele mesmo envia:
  // o usuário avalia a empresa, a empresa avalia o usuário.
  const tipo = role === "empresa" ? "empresa_para_usuario" : "usuario_para_empresa";
  const autorizado =
    role === "empresa" ? coleta.company.userId === userId : coleta.solicitacao.userId === userId;

  if (!autorizado) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const avaliacao = await buscarAvaliacaoDaColeta(coletaId, tipo);
  return NextResponse.json(avaliacao ?? null);
}
