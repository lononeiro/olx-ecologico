import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "usuario" | "admin" | "empresa";

/**
 * Obtém a sessão autenticada e verifica se o usuário possui a role exigida.
 * Retorna { session } em caso de sucesso ou { error } com NextResponse em caso de falha.
 */
export async function autorizarRota(rolesPermitidas: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const role = (session.user as any).role as Role;
  if (!rolesPermitidas.includes(role)) {
    return {
      error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    };
  }

  return { session };
}

/** Retorna o id numérico do usuário da sessão. */
export function getUserId(session: any): number {
  return Number((session.user as any).id);
}
