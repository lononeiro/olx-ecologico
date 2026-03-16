import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { enviarMensagem, listarMensagensColeta } from "@/services/mensagem.service";
import { mensagemCreateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/mensagens/[coletaId]
// Só retorna as mensagens se o usuário autenticado for o dono
// da solicitação ou a empresa responsável pela coleta.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario", "empresa", "admin"]);
  if (error) return error;

  const coletaId = Number(params.id);
  if (isNaN(coletaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const userId = getUserId(session!);
    const mensagens = await listarMensagensColeta(coletaId, userId);
    return NextResponse.json(mensagens);
  } catch (err: any) {
    // "Acesso negado" vira 403, demais erros viram 500
    const status = err.message.startsWith("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST /api/mensagens/[coletaId]
// Só envia se o usuário pertencer à conversa.
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
    const body   = await req.json();
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
    const status = err.message.startsWith("Sem permissão") ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}