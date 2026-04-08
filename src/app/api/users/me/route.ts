import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autorizarRota, getUserId } from "@/lib/route-guard";
import { applyCors, createCorsPreflightResponse } from "@/lib/cors";
import { profileUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

const userSelect = {
  id: true,
  nome: true,
  email: true,
  endereco: true,
  telefone: true,
  status: true,
  createdAt: true,
  role: { select: { id: true, nome: true } },
  company: {
    select: {
      id: true,
      cnpj: true,
      descricao: true,
      createdAt: true,
    },
  },
} as const;

export async function GET(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario", "admin", "empresa"]);
  if (error) return applyCors(req, error);

  const userId = getUserId(session!);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    return applyCors(
      req,
      NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 })
    );
  }

  return applyCors(req, NextResponse.json(user));
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await autorizarRota(["usuario", "admin", "empresa"]);
  if (error) return applyCors(req, error);

  const userId = getUserId(session!);
  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return applyCors(
      req,
      NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    );
  }

  const { nome, telefone, endereco } = parsed.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      nome,
      telefone: telefone ?? null,
      endereco: endereco ?? null,
    },
    select: userSelect,
  });

  return applyCors(req, NextResponse.json(user));
}
