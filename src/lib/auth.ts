import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
      }

      if (token.id) {
        const refreshedUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          include: { role: true },
        });

        if (refreshedUser) {
          token.name = refreshedUser.nome;
          token.email = refreshedUser.email;
          token.role = refreshedUser.role.nome;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.name =
          typeof token.name === "string" ? token.name : session.user.name;
        session.user.email =
          typeof token.email === "string" ? token.email : session.user.email;
      }

      return session;
    },
  },
};
