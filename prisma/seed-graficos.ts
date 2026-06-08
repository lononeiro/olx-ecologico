import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Marcador usado para identificar (e limpar) os dados criados por este seed.
const GRAF_PREFIX = "[graf]";

const DIA = 24 * 60 * 60 * 1000;
const HORA = 60 * 60 * 1000;
const now = () => Date.now();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function chance(p: number) {
  return Math.random() < p;
}
function codigo() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
function diasAtras(d: number) {
  return new Date(now() - d * DIA);
}

function inicioSemana() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // segunda-feira
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const COMENTARIOS = [
  "Atendimento excelente, pontuais e educados!",
  "Coleta rápida, recomendo.",
  "Tudo certo, só avisaram em cima da hora.",
  "Equipe muito atenciosa.",
  "Demorou um pouco, mas resolveram bem.",
  "Processo simples e eficiente.",
  "Voltarei a usar com certeza.",
  "",
];

type Cidadao = { id: number; endereco: string | null };
type Material = { id: number; nome: string };

async function limparDadosGraf() {
  const sols = await prisma.solicitacaoColeta.findMany({
    where: { titulo: { startsWith: GRAF_PREFIX } },
    select: { id: true, coleta: { select: { id: true } } },
  });
  const solIds = sols.map((s) => s.id);
  const colIds = sols
    .map((s) => s.coleta?.id)
    .filter((x): x is number => typeof x === "number");

  if (colIds.length) {
    await prisma.avaliacao.deleteMany({ where: { coletaId: { in: colIds } } });
    await prisma.mensagem.deleteMany({ where: { coletaId: { in: colIds } } });
    await prisma.coleta.deleteMany({ where: { id: { in: colIds } } });
  }
  if (solIds.length) {
    const convs = await prisma.conversaSolicitacao.findMany({
      where: { solicitacaoId: { in: solIds } },
      select: { id: true },
    });
    const convIds = convs.map((c) => c.id);
    if (convIds.length) {
      await prisma.mensagemPreAceite.deleteMany({ where: { conversaId: { in: convIds } } });
      await prisma.conversaSolicitacao.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.solicitacaoImagem.deleteMany({ where: { solicitacaoId: { in: solIds } } });
    await prisma.solicitacaoColeta.deleteMany({ where: { id: { in: solIds } } });
  }
  return solIds.length;
}

async function criarColeta(cfg: {
  companyId: number;
  cidadao: Cidadao;
  material: Material;
  status: string;
  createdAt: Date;
  dataAceite: Date;
  dataConclusao?: Date;
  dataPrevisaoColeta?: Date;
  nota?: number;
  comentario?: string;
}) {
  const sol = await prisma.solicitacaoColeta.create({
    data: {
      titulo: `${GRAF_PREFIX} ${cfg.material.nome}`,
      descricao: "Material reciclável para coleta (dados de demonstração).",
      quantidade: `${randInt(2, 40)} kg`,
      endereco: cfg.cidadao.endereco ?? "Endereço de teste, SP",
      status: "aprovada",
      aprovado: true,
      userId: cfg.cidadao.id,
      materialId: cfg.material.id,
      createdAt: cfg.createdAt,
    },
  });
  const col = await prisma.coleta.create({
    data: {
      solicitacaoId: sol.id,
      companyId: cfg.companyId,
      status: cfg.status,
      codigoConfirmacao: codigo(),
      dataAceite: cfg.dataAceite,
      dataPrevisaoColeta: cfg.dataPrevisaoColeta,
      dataConclusao: cfg.dataConclusao,
    },
  });
  if (cfg.nota) {
    await prisma.avaliacao.create({
      data: {
        coletaId: col.id,
        autorId: cfg.cidadao.id,
        nota: cfg.nota,
        comentario: cfg.comentario || undefined,
      },
    });
  }
  return col;
}

async function gerarParaEmpresa(
  companyId: number,
  cidadaos: Cidadao[],
  materiais: Material[],
  plano: { concluidas: number; canceladas: number; ativas: number; agendadas: number }
) {
  const proxMaterial = (() => {
    let i = 0;
    return () => materiais[i++ % materiais.length];
  })();
  const proxCidadao = (() => {
    let i = 0;
    return () => cidadaos[i++ % cidadaos.length];
  })();

  let total = 0;

  // Concluídas — espalhadas pelos últimos ~6 meses, com duração válida (aceite -> conclusão).
  for (let i = 0; i < plano.concluidas; i++) {
    const aceiteDias = randInt(3, 178);
    const duracaoH = randInt(2, Math.min(120, aceiteDias * 24 - 2));
    const dataAceite = diasAtras(aceiteDias);
    const dataConclusao = new Date(dataAceite.getTime() + duracaoH * HORA);
    const createdAt = new Date(dataAceite.getTime() - randInt(1, 4) * DIA);
    const temNota = chance(0.75);
    await criarColeta({
      companyId,
      cidadao: proxCidadao(),
      material: proxMaterial(),
      status: "concluida",
      createdAt,
      dataAceite,
      dataConclusao,
      nota: temNota ? pick([5, 5, 5, 4, 4, 3]) : undefined,
      comentario: temNota ? pick(COMENTARIOS) : undefined,
    });
    total++;
  }

  // Canceladas
  for (let i = 0; i < plano.canceladas; i++) {
    const aceiteDias = randInt(5, 140);
    const dataAceite = diasAtras(aceiteDias);
    await criarColeta({
      companyId,
      cidadao: proxCidadao(),
      material: proxMaterial(),
      status: "cancelada",
      createdAt: new Date(dataAceite.getTime() - randInt(1, 4) * DIA),
      dataAceite,
    });
    total++;
  }

  // Ativas (sem previsão específica) — aceita / a_caminho / em_coleta
  const statusAtivos = ["aceita", "a_caminho", "em_coleta"];
  for (let i = 0; i < plano.ativas; i++) {
    const aceiteDias = randInt(0, 12);
    const dataAceite = diasAtras(aceiteDias);
    await criarColeta({
      companyId,
      cidadao: proxCidadao(),
      material: proxMaterial(),
      status: statusAtivos[i % statusAtivos.length],
      createdAt: new Date(dataAceite.getTime() - randInt(1, 3) * DIA),
      dataAceite,
    });
    total++;
  }

  // Agendadas nesta semana — alimentam o calendário "Próximas coletas agendadas".
  const segunda = inicioSemana();
  for (let i = 0; i < plano.agendadas; i++) {
    const dataAceite = diasAtras(randInt(1, 8));
    const prev = new Date(segunda.getTime() + randInt(0, 6) * DIA);
    prev.setHours(randInt(8, 17), pick([0, 15, 30, 45]), 0, 0);
    await criarColeta({
      companyId,
      cidadao: proxCidadao(),
      material: proxMaterial(),
      status: pick(["aceita", "a_caminho"]),
      createdAt: new Date(dataAceite.getTime() - randInt(1, 3) * DIA),
      dataAceite,
      dataPrevisaoColeta: prev,
    });
    total++;
  }

  return total;
}

async function main() {
  console.log("📊 Seed de gráficos iniciando...");

  const materiais = await prisma.materialTipo.findMany({ orderBy: { id: "asc" } });
  if (materiais.length === 0) {
    throw new Error("Materiais não encontrados. Rode 'npm run db:seed' antes deste seed.");
  }

  const empresas = await prisma.company.findMany({ include: { user: true } });
  const reciclaMax = empresas.find((e) => /recicla/i.test(e.user.nome));
  const ecoVerde = empresas.find((e) => /eco/i.test(e.user.nome));
  if (!reciclaMax) {
    throw new Error("ReciclaMax não encontrada. Rode 'npm run db:seed' antes deste seed.");
  }

  // Cidadãos extras para dar variedade (cidadãos atendidos / avaliações).
  const senha = await bcrypt.hash("user123", 12);
  const extras = [
    { nome: "Ana Souza", email: "ana@example.com", endereco: "Rua Verde, 10 - São Paulo, SP", telefone: "11990000010" },
    { nome: "Bruno Lima", email: "bruno@example.com", endereco: "Av. Brasil, 220 - São Paulo, SP", telefone: "11990000011" },
    { nome: "Clara Dias", email: "clara@example.com", endereco: "Rua do Sol, 45 - Campinas, SP", telefone: "19990000012" },
    { nome: "Diego Rocha", email: "diego@example.com", endereco: "Rua das Acácias, 78 - Santo André, SP", telefone: "11990000013" },
    { nome: "Elena Costa", email: "elena@example.com", endereco: "Av. Central, 1000 - Guarulhos, SP", telefone: "11990000014" },
    { nome: "Felipe Alves", email: "felipe@example.com", endereco: "Rua Nova, 12 - Osasco, SP", telefone: "11990000015" },
  ];
  for (const c of extras) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, senhaHash: senha, roleId: 1, status: "ativo" },
    });
  }

  const cidadaos = (
    await prisma.user.findMany({ where: { roleId: 1 }, select: { id: true, endereco: true } })
  ) as Cidadao[];

  console.log(`🧹 Limpando dados de gráficos anteriores...`);
  const removidos = await limparDadosGraf();
  console.log(`   removidas ${removidos} solicitações '${GRAF_PREFIX}'.`);

  const totalRecicla = await gerarParaEmpresa(reciclaMax.id, cidadaos, materiais, {
    concluidas: 34,
    canceladas: 5,
    ativas: 6,
    agendadas: 10,
  });
  console.log(`✅ ReciclaMax: ${totalRecicla} coletas geradas.`);

  if (ecoVerde) {
    const totalEco = await gerarParaEmpresa(ecoVerde.id, cidadaos, materiais, {
      concluidas: 18,
      canceladas: 3,
      ativas: 4,
      agendadas: 6,
    });
    console.log(`✅ EcoVerde: ${totalEco} coletas geradas.`);
  }

  console.log("\n🎉 Seed de gráficos concluído!");
  console.log("   Rode novamente quando quiser regenerar — ele limpa os dados '[graf]' antes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
