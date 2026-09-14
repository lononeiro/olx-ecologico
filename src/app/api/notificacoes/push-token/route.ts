import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { removerPushToken, salvarPushToken } from "@/services/push.service";

export const dynamic = "force-dynamic";

const ROLES = ["usuario", "empresa", "admin"] as const;

// POST /api/notificacoes/push-token — registra o Expo push token do device
export async function POST(req: NextRequest) {
  const { session, error } = await autorizarRota([...ROLES]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const platform = typeof body?.platform === "string" ? body.platform : null;

  if (!token) {
    return NextResponse.json({ error: "Token ausente" }, { status: 400 });
  }

  const userId = getUserId(session!);
  await salvarPushToken(userId, token, platform);

  return NextResponse.json({ ok: true });
}

// DELETE /api/notificacoes/push-token — remove o token (logout)
export async function DELETE(req: NextRequest) {
  const { error } = await autorizarRota([...ROLES]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Token ausente" }, { status: 400 });
  }

  await removerPushToken(token);

  return NextResponse.json({ ok: true });
}
