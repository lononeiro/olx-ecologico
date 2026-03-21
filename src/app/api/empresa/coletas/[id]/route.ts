import { NextRequest, NextResponse } from "next/server";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { atualizarStatusColeta, buscarColetaPorId } from "@/services/coleta.service";
import { coletaStatusSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';

// GET /api/empresa/coletas/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["empresa", "usuario"]);
  if (error) return error;

  const id = Number(params.id);
  const role = (session!.user as any).role;
  const userId = getUserId(session!);

  try {
    let coleta;
    if (role === "empresa") {
      const company = await prisma.company.findUnique({ where: { userId } });
      coleta = await buscarColetaPorId(id, undefined, company?.id);
    } else {
      coleta = await buscarColetaPorId(id, userId);
    }

    if (!coleta) {
      return NextResponse.json({ error: "Coleta não encontrada" }, { status: 404 });
    }

    return NextResponse.json(coleta);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/empresa/coletas/[id] — atualiza status da coleta
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await autorizarRota(["empresa"]);
  if (error) return error;

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const userId = getUserId(session!);

  try {
    const body = await req.json();
    const parsed = coletaStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Quando concluir, valida o codigo de confirmacao do usuario
    if (parsed.data.status === "concluida") {
      const codigoEnviado = parsed.data.codigoConfirmacao?.trim().toUpperCase();
      if (!codigoEnviado) {
        return NextResponse.json({ error: "Codigo de confirmacao obrigatorio para concluir." }, { status: 400 });
      }
      const coleta = await prisma.coleta.findFirst({ where: { id, companyId: company.id } });
      if (!coleta) {
        return NextResponse.json({ error: "Coleta nao encontrada." }, { status: 404 });
      }
      if (coleta.codigoConfirmacao !== codigoEnviado) {
        return NextResponse.json({ error: "Codigo de confirmacao invalido." }, { status: 400 });
      }
    }

    const coleta = await atualizarStatusColeta(id, company.id, parsed.data.status);
    return NextResponse.json(coleta);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}