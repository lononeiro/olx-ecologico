import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 15;
  const search = searchParams.get("search") ?? "";

  const where = search ? {
    OR: [
      { user: { nome:  { contains: search, mode: "insensitive" as const } } },
      { user: { email: { contains: search, mode: "insensitive" as const } } },
      { cnpj: { contains: search, mode: "insensitive" as const } },
    ],
  } : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, nome: true, email: true, status: true } },
        _count: { select: { coletas: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const companyIds = companies.map(c => c.id);
  const concluidasAgg = companyIds.length > 0
    ? await prisma.coleta.groupBy({
        by: ["companyId"],
        _count: { _all: true },
        where: { companyId: { in: companyIds }, status: "concluida" },
      })
    : [];

  const result = companies.map(c => ({
    ...c,
    coletasConcluidas: concluidasAgg.find(a => a.companyId === c.id)?._count._all ?? 0,
  }));

  return NextResponse.json({ companies: result, total, page, totalPages: Math.ceil(total / limit) });
}
