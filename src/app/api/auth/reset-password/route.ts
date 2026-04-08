import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getStrongPasswordIssues } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, email, novaSenha } = await req.json();

    if (!token || !email || !novaSenha) {
      return NextResponse.json(
        { error: "Token, email e nova senha são obrigatórios." },
        { status: 400 }
      );
    }

    const passwordIssues = getStrongPasswordIssues(novaSenha);
    if (passwordIssues.length > 0) {
      return NextResponse.json({ error: passwordIssues[0] }, { status: 400 });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const usuario = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (usuario.resetToken !== resetTokenHash) {
      return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    }

    if (!usuario.resetTokenExpiry || new Date() > usuario.resetTokenExpiry) {
      return NextResponse.json(
        { error: "Token expirado. Solicite um novo link de recuperação." },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);

    await prisma.user.update({
      where: { id: usuario.id },
      data: {
        senhaHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      { mensagem: "Senha atualizada com sucesso. Faça login com sua nova senha." },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Erro ao resetar senha." },
      { status: 500 }
    );
  }
}
