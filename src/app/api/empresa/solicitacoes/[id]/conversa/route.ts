import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { obterOuCriarConversaEmpresa } from "@/services/conversa-solicitacao.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await autorizarRota(["empresa"]);
  if (error) return error;

  const solicitacaoId = Number((await params).id);
  if (!solicitacaoId || Number.isNaN(solicitacaoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const conversa = await obterOuCriarConversaEmpresa(
      solicitacaoId,
      getUserId(session!)
    );
    return NextResponse.json(conversa);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
