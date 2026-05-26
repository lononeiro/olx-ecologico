import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { calcularMediaEmpresa } from "@/services/avaliacao.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const { session, error } = await autorizarRota(["empresa", "admin"]);
  if (error) return error;

  const companyId = Number(params.companyId);
  if (isNaN(companyId)) return NextResponse.json({ error: "companyId invalido" }, { status: 400 });

  const role = (session!.user as any).role;
  if (role === "empresa") {
    const userId = getUserId(session!);
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company || company.id !== companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }

  try {
    const resultado = await calcularMediaEmpresa(companyId);
    return NextResponse.json(resultado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
