import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user || user.status !== "ativo") return null;

        const senhaValida = await bcrypt.compare(
          credentials.password,
          user.senhaHash
        );
        if (!senhaValida) return null;

        return {
          id: String(user.id),
          name: user.nome,
          email: user.email,
          role: user.role.nome,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Na criação do token, adiciona role e id do usuário
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Expõe id e role na sessão do cliente
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
