import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarAvaliacoesDaEmpresa } from "@/services/avaliacao.service";
import { AvaliacoesEmpresaClient, type AvaliacoesEmpresaData } from "./AvaliacoesEmpresaClient";

export const dynamic = "force-dynamic";

export default async function EmpresaAvaliacoesPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa nao configurada.</p>;

  const result = await listarAvaliacoesDaEmpresa(company.id);

  const data: AvaliacoesEmpresaData = {
    resumo: result.resumo,
    coletas: result.coletas.map((coleta) => ({
      ...coleta,
      dataAceite: coleta.dataAceite.toISOString(),
      dataConclusao: coleta.dataConclusao?.toISOString() ?? null,
      avaliacao: coleta.avaliacao
        ? {
            ...coleta.avaliacao,
            createdAt: coleta.avaliacao.createdAt.toISOString(),
          }
        : null,
    })),
  };

  return <AvaliacoesEmpresaClient data={data} />;
}
