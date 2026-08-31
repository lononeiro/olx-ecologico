import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { avaliacaoCreateSchema } from "@/lib/validations";
import { criarAvaliacao } from "@/services/avaliacao.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario", "empresa"]);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = avaliacaoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const userId = getUserId(session!);
    const role = (session!.user as any).role as string;
    // A direção da avaliação é derivada do papel de quem envia.
    const tipo = role === "empresa" ? "empresa_para_usuario" : "usuario_para_empresa";
    const { coletaId, nota, comentario } = parsed.data;
    const avaliacao = await criarAvaliacao(coletaId, userId, nota, comentario, tipo);
    return NextResponse.json(avaliacao, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
