import { NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import {
  contarNaoLidas,
  listarNotificacoes,
  marcarTodasComoLidas,
} from "@/services/notificacao.service";

export const dynamic = "force-dynamic";

const ROLES = ["usuario", "empresa", "admin"] as const;

// GET /api/notificacoes — lista as notificações do usuário + total não lidas
export async function GET() {
  const { session, error } = await autorizarRota([...ROLES]);
  if (error) return error;

  const userId = getUserId(session!);
  const [notificacoes, naoLidas] = await Promise.all([
    listarNotificacoes(userId),
    contarNaoLidas(userId),
  ]);

  return NextResponse.json({ notificacoes, naoLidas });
}

// PATCH /api/notificacoes — marca todas como lidas
export async function PATCH() {
  const { session, error } = await autorizarRota([...ROLES]);
  if (error) return error;

  const userId = getUserId(session!);
  const atualizadas = await marcarTodasComoLidas(userId);

  return NextResponse.json({ atualizadas });
}
