import { NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { listarInboxMensagens, type InboxRole } from "@/services/mensagens-inbox.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await autorizarRota(["usuario", "empresa"]);
  if (error) return error;

  const role = (session!.user as any).role as InboxRole;
  const inbox = await listarInboxMensagens(getUserId(session!), role);

  return NextResponse.json(inbox);
}
