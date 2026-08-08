import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sanitizeCNPJ, verificarCnpjNaReceita } from "@/lib/cnpj";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { nome, senha, endereco, telefone, tipo, descricao } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();
    // O schema já garante presença + dígitos verificadores válidos para empresa.
    const cnpj = tipo === "empresa" ? sanitizeCNPJ(parsed.data.cnpj) : null;

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
    }

    const role = await prisma.role.findFirst({ where: { nome: tipo } });
    if (!role) {
      return NextResponse.json(
        { error: "Tipo de usuário inválido." },
        { status: 400 }
      );
    }

    if (tipo === "empresa" && cnpj) {
      // Bloqueia duplicidade antes de gastar a chamada externa.
      const cnpjExistente = await prisma.company.findUnique({ where: { cnpj } });
      if (cnpjExistente) {
        return NextResponse.json(
          { error: { cnpj: ["CNPJ já cadastrado."] } },
          { status: 409 }
        );
      }

      // Confirma que o CNPJ realmente existe e está ativo na Receita Federal.
      const check = await verificarCnpjNaReceita(cnpj);
      if (!check.ok) {
        return NextResponse.json(
          { error: { cnpj: [check.message] } },
          { status: check.status }
        );
      }
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const user = await prisma.$transaction(async (tx) => {
      const novoUsuario = await tx.user.create({
        data: { nome, email, senhaHash, endereco, telefone, roleId: role.id },
      });

      if (tipo === "empresa" && cnpj) {
        await tx.company.create({
          data: { userId: novoUsuario.id, cnpj, descricao },
        });
      }

      return novoUsuario;
    });

    return NextResponse.json(
      { message: "Usuário criado com sucesso.", id: user.id },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Erro interno." },
      { status: 500 }
    );
  }
}
