import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { enviarMensagem, listarMensagensColeta } from "@/services/mensagem.service";
import { mensagemCreateSchema } from "@/lib/validations";
export const dynamic = 'force-dynamic';

// GET /api/mensagens/[coletaId] — lista mensagens de uma coleta
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await autorizarRota(["usuario", "empresa", "admin"]);
  if (error) return error;

  const coletaId = Number(params.id);
  if (isNaN(coletaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const mensagens = await listarMensagensColeta(coletaId);
    return NextResponse.json(mensagens);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/mensagens/[coletaId] — envia mensagem
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario", "empresa"]);
  if (error) return error;

  const coletaId = Number(params.id);
  if (isNaN(coletaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = mensagemCreateSchema.safeParse({ ...body, coletaId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const remetenteId = getUserId(session!);
    const mensagem = await enviarMensagem(coletaId, remetenteId, parsed.data.mensagem);

    return NextResponse.json(mensagem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
