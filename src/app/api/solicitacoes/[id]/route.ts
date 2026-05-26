import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { buscarSolicitacaoPorId, cancelarSolicitacao } from "@/services/solicitacao.service";
export const dynamic = "force-dynamic";

const cancelarSchema = z.object({ action: z.literal("cancelar") });

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario"]);
  if (error) return error;

  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID invalido" }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = cancelarSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Acao invalida" }, { status: 400 });

    const userId = getUserId(session!);
    const resultado = await cancelarSolicitacao(id, userId);
    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
