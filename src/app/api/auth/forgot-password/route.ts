import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/auth/forgot-password
// Body: { email: "usuario@example.com" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, nome: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { mensagem: "Se o email existir, você receberá instruções de recuperação" },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: usuario.id },
      data: { resetToken: resetTokenHash, resetTokenExpiry },
    });

    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetLink = `${base}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log(`[DEV] Link de reset: ${resetLink}`);

    return NextResponse.json(
      {
        mensagem: "Se o email existir, você receberá instruções de recuperação",
        resetLink,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
