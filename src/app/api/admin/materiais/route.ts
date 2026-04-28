import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autorizarRota } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await autorizarRota(["admin"]);
  if (auth.error) return auth.error;

  const materiais = await prisma.materialTipo.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { solicitacoes: true } } },
  });

  return NextResponse.json(materiais);
}

export async function POST(req: NextRequest) {
  const auth = await autorizarRota(["admin"]);
  if (auth.error) return auth.error;

  const { nome } = await req.json();

  if (!nome || typeof nome !== "string" || !nome.trim()) {
    return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
  }

  const nomeNormalizado = nome.trim();

  const existente = await prisma.materialTipo.findFirst({
    where: { nome: { equals: nomeNormalizado, mode: "insensitive" } },
  });
  if (existente) {
    return NextResponse.json({ error: "Ja existe um material com este nome" }, { status: 409 });
  }

  const material = await prisma.materialTipo.create({
    data: { nome: nomeNormalizado },
    include: { _count: { select: { solicitacoes: true } } },
  });

  return NextResponse.json(material, { status: 201 });
}
