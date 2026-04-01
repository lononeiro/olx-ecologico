import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePageClient } from "./ProfilePageClient";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = Number((session.user as any).id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      endereco: true,
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
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <ProfilePageClient initialProfile={user} />
      </main>
    </div>
  );
}
