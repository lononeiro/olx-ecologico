import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["ativo", "inativo"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const id = Number((await params).id);
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.role.nome === "admin") return NextResponse.json({ error: "Não é possível alterar outros administradores" }, { status: 403 });

  const updated = await prisma.user.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const id = Number((await params).id);
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      _count: { select: { solicitacoes: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.role.nome === "admin") return NextResponse.json({ error: "Não é possível excluir administradores" }, { status: 403 });
  if (user._count.solicitacoes > 0) return NextResponse.json({ error: "Usuário possui solicitações e não pode ser excluído" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
