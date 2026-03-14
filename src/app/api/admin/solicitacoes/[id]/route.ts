import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { atualizarStatusSolicitacao } from "@/services/solicitacao.service";
import { z } from "zod";
export const dynamic = 'force-dynamic';

const schema = z.object({
  aprovado: z.boolean(),
});

// PATCH /api/admin/solicitacoes/[id] — aprova ou rejeita solicitação
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const solicitacao = await atualizarStatusSolicitacao(id, parsed.data.aprovado);
    return NextResponse.json(solicitacao);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
