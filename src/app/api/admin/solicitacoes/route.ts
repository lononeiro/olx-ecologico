import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page")   ?? 1));
  const limit  = 15;
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const where = {
    AND: [
      status ? { status } : {},
      search ? { OR: [
        { titulo: { contains: search, mode: "insensitive" as const } },
        { user: { nome:  { contains: search, mode: "insensitive" as const } } },
        { user: { email: { contains: search, mode: "insensitive" as const } } },
      ]} : {},
    ],
  };

  const [solicitacoes, total] = await Promise.all([
    prisma.solicitacaoColeta.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user:     { select: { id: true, nome: true, email: true } },
        material: { select: { nome: true } },
        coleta: {
          select: {
            id: true, status: true, dataConclusao: true,
            company: { include: { user: { select: { nome: true } } } },
          },
        },
      },
    }),
    prisma.solicitacaoColeta.count({ where }),
  ]);

  return NextResponse.json({ solicitacoes, total, page, totalPages: Math.ceil(total / limit) });
}
