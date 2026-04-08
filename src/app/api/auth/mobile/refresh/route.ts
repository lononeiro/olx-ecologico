import { NextRequest, NextResponse } from "next/server";
import { mobileRefreshSchema } from "@shared";
import {
  createMobileAuthTokens,
  verifyMobileToken,
} from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = mobileRefreshSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const payload = await verifyMobileToken(parsed.data.refreshToken, "refresh");
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });

    if (!user || user.status !== "ativo") {
      return NextResponse.json({ error: "Usuario invalido" }, { status: 401 });
    }

    return NextResponse.json(
      await createMobileAuthTokens({
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.role.nome as "usuario" | "admin" | "empresa",
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Refresh token invalido" },
      { status: 401 }
    );
  }
}
