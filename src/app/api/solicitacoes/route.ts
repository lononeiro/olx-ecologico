import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { solicitacaoCreateSchema } from "@/lib/validations";
import {
  criarSolicitacao,
  listarSolicitacoesDoUsuario,
  listarSolicitacoesAprovadas,
  listarSolicitacoesPendentes,
} from "@/services/solicitacao.service";

// Impede pré-renderização estática no build da Vercel
export const dynamic = "force-dynamic";

// GET /api/solicitacoes — retorna lista baseada no role do usuário
export async function GET(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario", "admin", "empresa"]);
  if (error) return error;

  const role = (session!.user as any).role;
  const userId = getUserId(session!);

  try {
    let data;

    if (role === "usuario") {
      data = await listarSolicitacoesDoUsuario(userId);
    } else if (role === "admin") {
      data = await listarSolicitacoesPendentes();
    } else if (role === "empresa") {
      data = await listarSolicitacoesAprovadas();
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/solicitacoes — cria nova solicitação (somente usuário)
export async function POST(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario"]);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = solicitacaoCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userId = getUserId(session!);
    const solicitacao = await criarSolicitacao(userId, parsed.data);

    return NextResponse.json(solicitacao, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
