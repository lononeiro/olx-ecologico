import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@shared";
import {
  authenticateUserByCredentials,
  createMobileAuthTokens,
} from "@/lib/mobile-auth";
import { applyCors, createCorsPreflightResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return createCorsPreflightResponse(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return applyCors(
        req,
        NextResponse.json(
          { error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        )
      );
    }

    const user = await authenticateUserByCredentials(
      parsed.data.email,
      parsed.data.senha
    );

    if (!user) {
      return applyCors(
        req,
        NextResponse.json(
          { error: "Email ou senha invalidos" },
          { status: 401 }
        )
      );
    }

    return applyCors(req, NextResponse.json(await createMobileAuthTokens(user)));
  } catch (error: any) {
    return applyCors(
      req,
      NextResponse.json(
        { error: error?.message ?? "Erro ao autenticar" },
        { status: 500 }
      )
    );
  }
}
