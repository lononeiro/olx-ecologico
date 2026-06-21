import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { listarConversasDaSolicitacaoUsuario } from "@/services/conversa-solicitacao.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await autorizarRota(["usuario"]);
  if (error) return error;

  const solicitacaoId = Number((await params).id);
  if (!solicitacaoId || Number.isNaN(solicitacaoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const conversas = await listarConversasDaSolicitacaoUsuario(
      solicitacaoId,
      getUserId(session!)
    );
    return NextResponse.json(conversas);
  } catch (err: any) {
    const status = err.message.includes("sem permissão") ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
