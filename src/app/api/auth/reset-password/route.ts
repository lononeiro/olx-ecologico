import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// POST /api/auth/reset-password
// Body: { token: "abc123", email: "usuario@example.com", novaSenha: "nova123" }
export async function POST(req: NextRequest) {
  try {
    const { token, email, novaSenha } = await req.json();

    // Validar campos
    if (!token || !email || !novaSenha) {
      return NextResponse.json(
        { error: "Token, email e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar comprimento da senha
    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Hash do token recebido
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Buscar usuário com token válido e não expirado
    const usuario = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o token é válido
    if (usuario.resetToken !== resetTokenHash) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (!usuario.resetTokenExpiry || new Date() > usuario.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Token expirado. Solicite um novo link de recuperação" },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 12);

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: usuario.id },
      data: {
        senhaHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json(
      { mensagem: "Senha atualizada com sucesso. Faça login com sua nova senha." },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Erro ao resetar senha" },
      { status: 500 }
    );
  }
}
