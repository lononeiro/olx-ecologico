import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { marcarComoLida } from "@/services/notificacao.service";

export const dynamic = "force-dynamic";

// PATCH /api/notificacoes/[id] — marca uma notificação como lida
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["usuario", "empresa", "admin"]);
  if (error) return error;

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const userId = getUserId(session!);
  const ok = await marcarComoLida(id, userId);

  if (!ok) {
    return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
