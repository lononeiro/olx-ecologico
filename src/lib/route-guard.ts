import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getMobileUserFromAccessToken, toSessionLike } from "@/lib/mobile-auth";

type Role = "usuario" | "admin" | "empresa";

/**
 * Obtém a sessão autenticada e verifica se o usuário possui a role exigida.
 * Retorna { session } em caso de sucesso ou { error } com NextResponse em caso de falha.
 */
export async function autorizarRota(rolesPermitidas: Role[]) {
  const authorizationHeader = headers().get("authorization");
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;

  if (bearerToken) {
    try {
      const user = await getMobileUserFromAccessToken(bearerToken);
      if (!rolesPermitidas.includes(user.role)) {
        return {
          error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
        };
      }

      return { session: toSessionLike(user) };
    } catch {
      return {
        error: NextResponse.json({ error: "Token invalido" }, { status: 401 }),
      };
    }
  }

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
