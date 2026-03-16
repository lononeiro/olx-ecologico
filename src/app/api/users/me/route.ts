import { NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/usuarios/me — retorna dados do usuário autenticado
export async function GET() {
  const { session, error } = await autorizarRota(["usuario", "admin", "empresa"]);
  if (error) return error;

  const userId = getUserId(session!);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, endereco: true, telefone: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}