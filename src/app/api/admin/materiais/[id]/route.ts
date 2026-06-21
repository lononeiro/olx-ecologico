import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autorizarRota } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await autorizarRota(["admin"]);
  if (auth.error) return auth.error;

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { nome } = await req.json();
  if (!nome || typeof nome !== "string" || !nome.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const nomeNormalizado = nome.trim();

  const existente = await prisma.materialTipo.findFirst({
    where: { nome: { equals: nomeNormalizado, mode: "insensitive" }, NOT: { id } },
  });
  if (existente) {
    return NextResponse.json({ error: "Já existe um material com este nome" }, { status: 409 });
  }

  const material = await prisma.materialTipo.update({
    where: { id },
    data: { nome: nomeNormalizado },
    include: { _count: { select: { solicitacoes: true } } },
  });

  return NextResponse.json(material);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await autorizarRota(["admin"]);
  if (auth.error) return auth.error;

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const material = await prisma.materialTipo.findUnique({
    where: { id },
    include: { _count: { select: { solicitacoes: true } } },
  });

  if (!material) {
    return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
  }

  if (material._count.solicitacoes > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: ${material._count.solicitacoes} solicitação(ões) vinculada(s)` },
      { status: 409 }
    );
  }

  await prisma.materialTipo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
