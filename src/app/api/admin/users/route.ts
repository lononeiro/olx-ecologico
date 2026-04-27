import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page")   ?? 1));
  const limit = 15;
  const search = searchParams.get("search") ?? "";
  const role   = searchParams.get("role")   ?? "";
  const status = searchParams.get("status") ?? "";

  const where = {
    AND: [
      search ? { OR: [
        { nome:  { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ]} : {},
      role   ? { role:   { nome: role   } } : {},
      status ? { status: status          } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nome: true, email: true, telefone: true, status: true, createdAt: true,
        role: { select: { nome: true } },
        company: { select: { id: true, cnpj: true } },
        _count: { select: { solicitacoes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}
