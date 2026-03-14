import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/materiais — lista todos os tipos de materiais (público)
export async function GET() {
  try {
    const materiais = await prisma.materialTipo.findMany({
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(materiais);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
