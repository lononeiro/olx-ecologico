import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { buscarSolicitacaoPorId } from "@/services/solicitacao.service";

// GET /api/solicitacoes/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario", "admin", "empresa"]);
  if (error) return error;

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const role = (session!.user as any).role;
  const userId = getUserId(session!);

  try {
    // Usuário só pode ver suas próprias solicitações
    const solicitacao = await buscarSolicitacaoPorId(
      id,
      role === "usuario" ? userId : undefined
    );

    if (!solicitacao) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    return NextResponse.json(solicitacao);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
