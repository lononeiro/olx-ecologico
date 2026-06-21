import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auditAccess } from "@/lib/audit";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import {
  enviarMensagemConversaSolicitacao,
  listarMensagensConversaSolicitacao,
} from "@/services/conversa-solicitacao.service";

export const dynamic = "force-dynamic";

const mensagemPreAceiteSchema = z.object({
  mensagem: z.string().trim().min(1, "Digite uma mensagem.").max(1000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario", "empresa"]);
  if (error) return error;

  const conversaId = Number(params.id);
  if (!conversaId || Number.isNaN(conversaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const sinceIdParam = req.nextUrl.searchParams.get("sinceId");
  const sinceId = sinceIdParam ? Number(sinceIdParam) : undefined;

  if (sinceIdParam && (!sinceId || Number.isNaN(sinceId))) {
    return NextResponse.json({ error: "sinceId inválido" }, { status: 400 });
  }

  try {
    const userId = getUserId(session!);
    const mensagens = await listarMensagensConversaSolicitacao(conversaId, userId, {
      sinceId,
    });

    if (req.nextUrl.searchParams.get("audit") === "1") {
      auditAccess({
        userId,
        action: "open_pre_accept_chat",
        resource: "conversa_solicitacao",
        resourceId: conversaId,
      });
    }

    return NextResponse.json(mensagens);
  } catch (err: any) {
    const status = err.message.startsWith("Acesso negado") ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario", "empresa"]);
  if (error) return error;

  const conversaId = Number(params.id);
  if (!conversaId || Number.isNaN(conversaId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const parsed = mensagemPreAceiteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const remetenteId = getUserId(session!);
    const mensagem = await enviarMensagemConversaSolicitacao(
      conversaId,
      remetenteId,
      parsed.data.mensagem
    );

    return NextResponse.json(mensagem, { status: 201 });
  } catch (err: any) {
    const status = err.message.startsWith("Sem permissão") ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
