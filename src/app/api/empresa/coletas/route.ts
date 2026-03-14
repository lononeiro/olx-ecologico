import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { aceitarSolicitacao, listarColetasDaEmpresa } from "@/services/coleta.service";
import { prisma } from "@/lib/prisma";

// GET /api/empresa/coletas — lista coletas da empresa
export async function GET(req: NextRequest) {
  const { session, error } = await autorizarRota(["empresa"]);
  if (error) return error;

  const userId = getUserId(session!);

  try {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const coletas = await listarColetasDaEmpresa(company.id);
    return NextResponse.json(coletas);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/empresa/coletas — aceita uma solicitação
export async function POST(req: NextRequest) {
  const { session, error } = await autorizarRota(["empresa"]);
  if (error) return error;

  const userId = getUserId(session!);

  try {
    const { solicitacaoId } = await req.json();

    if (!solicitacaoId || isNaN(Number(solicitacaoId))) {
      return NextResponse.json({ error: "solicitacaoId inválido" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const coleta = await aceitarSolicitacao(Number(solicitacaoId), company.id);
    return NextResponse.json(coleta, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
