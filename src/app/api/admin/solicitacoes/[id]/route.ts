import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { removerSolicitacao } from "@/services/solicitacao.service";
export const dynamic = 'force-dynamic';

// DELETE /api/admin/solicitacoes/[id] — remove uma solicitação publicada (moderação reativa)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const id = Number((await params).id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const solicitacao = await removerSolicitacao(id);
    return NextResponse.json(solicitacao);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
