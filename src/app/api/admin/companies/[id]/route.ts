import { NextRequest, NextResponse } from "next/server";
import { autorizarRota } from "@/lib/route-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["ativo", "inativo"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await autorizarRota(["admin"]);
  if (error) return error;

  const id = Number(params.id);
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });

  await prisma.user.update({
    where: { id: company.userId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ success: true, status: parsed.data.status });
}
