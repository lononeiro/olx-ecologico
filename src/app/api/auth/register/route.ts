import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

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

    const { nome, email, senha, endereco, telefone, tipo, cnpj, descricao } =
      parsed.data;

    // Verifica se o email já está em uso
    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    // Determina o role_id baseado no tipo de cadastro
    const role = await prisma.role.findFirst({ where: { nome: tipo } });
    if (!role) {
      return NextResponse.json({ error: "Tipo de usuário inválido" }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    // Cria usuário e empresa numa transação, se necessário
    const user = await prisma.$transaction(async (tx) => {
      const novoUsuario = await tx.user.create({
        data: { nome, email, senhaHash, endereco, telefone, roleId: role.id },
      });

      if (tipo === "empresa") {
        if (!cnpj) throw new Error("CNPJ é obrigatório para empresas");
        // Verifica CNPJ duplicado
        const cnpjExistente = await tx.company.findUnique({ where: { cnpj } });
        if (cnpjExistente) throw new Error("CNPJ já cadastrado");

        await tx.company.create({
          data: { userId: novoUsuario.id, cnpj, descricao },
        });
      }

      return novoUsuario;
    });

    return NextResponse.json(
      { message: "Usuário criado com sucesso", id: user.id },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
