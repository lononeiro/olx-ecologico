/**
 * Backfill idempotente: adiciona avaliações no sentido empresa → cidadão
 * (`tipo: "empresa_para_usuario"`) às coletas concluídas que ainda não têm uma.
 * Não duplica nem apaga dados — pode rodar quantas vezes quiser.
 *
 * Uso: ts-node -P tsconfig.seed.json prisma/backfill-avaliacoes-empresa.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AVALIACOES: [number, string][] = [
  [5, "Material exatamente como descrito. Cliente pontual."],
  [4, "Acesso fácil ao local, tudo certo."],
  [5, "Ótimo cliente, sempre organiza bem o material."],
  [4, "Coleta tranquila, material bem separado."],
  [3, "Material um pouco diferente do combinado, mas resolvemos."],
  [5, "Cliente muito atencioso. Recomendamos!"],
];

async function main() {
  const coletas = await prisma.coleta.findMany({
    where: { status: "concluida" },
    include: {
      company: { select: { userId: true } },
      avaliacoes: { select: { tipo: true } },
    },
    orderBy: { id: "asc" },
  });

  let criadas = 0;
  let puladas = 0;

  for (const coleta of coletas) {
    const jaAvaliada = coleta.avaliacoes.some((a) => a.tipo === "empresa_para_usuario");
    if (jaAvaliada) {
      puladas++;
      continue;
    }

    const [nota, comentario] = AVALIACOES[criadas % AVALIACOES.length];
    await prisma.avaliacao.create({
      data: {
        coletaId: coleta.id,
        autorId: coleta.company.userId,
        tipo: "empresa_para_usuario",
        nota,
        comentario,
      },
    });
    criadas++;
  }

  console.log(`✅ Backfill concluído: ${criadas} avaliação(ões) empresa→cidadão criadas, ${puladas} já existiam.`);
}

main()
  .catch((err) => {
    console.error("❌ Falha no backfill:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
