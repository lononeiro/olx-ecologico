import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/auth/forgot-password
// Body: { email: "usuario@example.com" }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

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
      // Por segurança, retornar mensagem genérica
      return NextResponse.json(
        { mensagem: "Se o email existir, você receberá instruções de recuperação" },
        { status: 200 }
      );
    }

    // Gerar token de reset (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco de dados
    await prisma.user.update({
      where: { id: usuario.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry: resetTokenExpiry
      }
    });

    // Aqui você enviaria o email com o link de reset
    // Exemplo usando seu serviço de email favorito (Nodemailer, SendGrid, etc)
    
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${email}`;
    
    // TODO: Enviar email com o link
    // await enviarEmailRecuperacao(email, usuario.nome, resetLink);

    console.log(`Link de reset: ${resetLink}`); // Remove em produção

    return NextResponse.json(
      { 
        mensagem: "Se o email existir, você receberá instruções de recuperação",
        // Remove em produção - apenas para teste
        resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined
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
