import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

type Role = "usuario" | "admin" | "empresa";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type TokenType = "access" | "refresh";

const ACCESS_TOKEN_TTL = 60 * 15;
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;

function getMobileJwtSecret() {
  const secret =
    process.env.MOBILE_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Configure MOBILE_AUTH_SECRET ou NEXTAUTH_SECRET");
  }

  return new TextEncoder().encode(secret);
}

export async function authenticateUserByCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || user.status !== "ativo") return null;

  const senhaValida = await bcrypt.compare(password, user.senhaHash);
  if (!senhaValida) return null;

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    role: user.role.nome as Role,
  };
}

async function signToken(
  user: AuthUser,
  tokenType: TokenType,
  expiresInSeconds: number
) {
  return new SignJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    type: tokenType,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getMobileJwtSecret());
}

export async function createMobileAuthTokens(user: AuthUser) {
  const [accessToken, refreshToken] = await Promise.all([
    signToken(user, "access", ACCESS_TOKEN_TTL),
    signToken(user, "refresh", REFRESH_TOKEN_TTL),
  ]);

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer" as const,
    expiresIn: ACCESS_TOKEN_TTL,
    user,
  };
}

export async function verifyMobileToken(token: string, expectedType: TokenType) {
  const verified = await jwtVerify(token, getMobileJwtSecret());
  const payload = verified.payload;

  if (payload.type !== expectedType) {
    throw new Error("Tipo de token invalido");
  }

  return {
    id: Number(payload.sub),
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    role: String(payload.role ?? "") as Role,
  };
}

export async function getMobileUserFromAccessToken(token: string) {
  const payload = await verifyMobileToken(token, "access");

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { role: true },
  });

  if (!user || user.status !== "ativo") {
    throw new Error("Usuario invalido");
  }

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    role: user.role.nome as Role,
  };
}

export function toSessionLike(user: AuthUser) {
  return {
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
