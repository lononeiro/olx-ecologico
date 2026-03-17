import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/auth/check-email?email=usuario@example.com
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { existe: true, mensagem: "Este email já está cadastrado" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { existe: false, mensagem: "Email disponível" },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Erro interno" },
      { status: 500 }
    );
  }
}
