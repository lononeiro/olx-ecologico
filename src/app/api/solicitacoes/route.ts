import { NextRequest, NextResponse } from "next/server";
import { applyCors, createCorsPreflightResponse } from "@/lib/cors";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { solicitacaoCreateSchema } from "@/lib/validations";
import {
  criarSolicitacao,
  listarSolicitacoesAdmin,
  listarSolicitacoesDoUsuario,
  listarSolicitacoesAprovadas,
} from "@/services/solicitacao.service";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

export async function GET(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario", "admin", "empresa"]);
  if (error) return applyCors(req, error);

  const role   = (session!.user as any).role;
  const userId = getUserId(session!);

  try {
    let data;
    if (role === "usuario")  data = await listarSolicitacoesDoUsuario(userId);
    if (role === "admin")    data = await listarSolicitacoesAdmin();
    if (role === "empresa")  data = await listarSolicitacoesAprovadas();
    return applyCors(req, NextResponse.json(data));
  } catch (err: any) {
    return applyCors(
      req,
      NextResponse.json({ error: err.message }, { status: 500 })
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario"]);
  if (error) return applyCors(req, error);

  try {
    const body   = await req.json();
    const parsed = solicitacaoCreateSchema.safeParse(body);

    if (!parsed.success) {
      // Retorna os erros por campo E um resumo legível para facilitar debug
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const resumo = Object.entries(fieldErrors)
        .map(([campo, msgs]) => `${campo}: ${(msgs as string[]).join(", ")}`)
        .join(" | ");

      return applyCors(
        req,
        NextResponse.json(
          { error: fieldErrors, resumo },
          { status: 400 }
        )
      );
    }

    const userId     = getUserId(session!);
    const solicitacao = await criarSolicitacao(userId, parsed.data);
    return applyCors(req, NextResponse.json(solicitacao, { status: 201 }));
  } catch (err: any) {
    return applyCors(
      req,
      NextResponse.json({ error: err.message }, { status: 500 })
    );
  }
}
