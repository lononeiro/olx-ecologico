import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ── Roles ──────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.role.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nome: "usuario" } }),
    prisma.role.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nome: "admin" } }),
    prisma.role.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nome: "empresa" } }),
  ]);
  console.log("✅ Roles criadas");

  // ── Materiais ──────────────────────────────────────────────────────────────
  const nomeMateriais = [
    "Papel / Papelão",
    "Plástico",
    "Metal / Alumínio",
    "Vidro",
    "Eletrônicos (e-lixo)",
    "Orgânico",
    "Têxtil",
    "Óleo de Cozinha",
    "Madeira",
    "Borracha / Pneus",
  ];

  for (let i = 0; i < nomeMateriais.length; i++) {
    await prisma.materialTipo.upsert({
      where: { id: i + 1 },
      update: {},
      create: { id: i + 1, nome: nomeMateriais[i] },
    });
  }
  console.log("✅ Materiais criados:", nomeMateriais.length);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@recicla.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@recicla.com",
      senhaHash: adminHash,
      roleId: 2,
      status: "ativo",
    },
  });
  console.log("✅ Admin criado");

  // ── Usuários cidadãos ──────────────────────────────────────────────────────
  const senhaUser = await bcrypt.hash("user123", 12);

  const joao = await prisma.user.upsert({
    where: { email: "joao@example.com" },
    update: {},
    create: {
      nome: "João Silva",
      email: "joao@example.com",
      senhaHash: senhaUser,
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      telefone: "11999990000",
      roleId: 1,
      status: "ativo",
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: {},
    create: {
      nome: "Maria Oliveira",
      email: "maria@example.com",
      senhaHash: senhaUser,
      endereco: "Av. Paulista, 900 - São Paulo, SP",
      telefone: "11988880001",
      roleId: 1,
      status: "ativo",
    },
  });

  const carlos = await prisma.user.upsert({
    where: { email: "carlos@example.com" },
    update: {},
    create: {
      nome: "Carlos Mendes",
      email: "carlos@example.com",
      senhaHash: senhaUser,
      endereco: "Rua Augusta, 500 - Campinas, SP",
      telefone: "19977770002",
      roleId: 1,
      status: "ativo",
    },
  });
  console.log("✅ Usuários criados: joao, maria, carlos");

  // ── Empresas ───────────────────────────────────────────────────────────────
  const senhaEmpresa = await bcrypt.hash("empresa123", 12);

  const emp1User = await prisma.user.upsert({
    where: { email: "empresa@recicla.com" },
    update: {},
    create: {
      nome: "ReciclaMax Ltda",
      email: "empresa@recicla.com",
      senhaHash: senhaEmpresa,
      roleId: 3,
      status: "ativo",
    },
  });
  const empresa1 = await prisma.company.upsert({
    where: { userId: emp1User.id },
    update: {},
    create: {
      userId: emp1User.id,
      cnpj: "12.345.678/0001-90",
      descricao: "Especializada em coleta e reciclagem de materiais domésticos e industriais.",
    },
  });

  const emp2User = await prisma.user.upsert({
    where: { email: "ecoverde@empresa.com" },
    update: {},
    create: {
      nome: "EcoVerde Soluções",
      email: "ecoverde@empresa.com",
      senhaHash: senhaEmpresa,
      roleId: 3,
      status: "ativo",
    },
  });
  const empresa2 = await prisma.company.upsert({
    where: { userId: emp2User.id },
    update: {},
    create: {
      userId: emp2User.id,
      cnpj: "98.765.432/0001-11",
      descricao: "Coleta seletiva para condomínios e empresas. Atuamos em toda a região metropolitana.",
    },
  });
  console.log("✅ Empresas criadas: ReciclaMax, EcoVerde");

  // ── Helper: busca material por nome ───────────────────────────────────────
  const materiais = await prisma.materialTipo.findMany();
  const mat = (nome: string) => materiais.find((m) => m.nome.toLowerCase().includes(nome.toLowerCase()))!;

  // ── Solicitações e fluxos ──────────────────────────────────────────────────

  // 1. Pendente (aguardando aprovação do admin)
  await upsertSolicitacao({
    titulo: "Caixas de papelão pós-mudança",
    descricao: "Tenho aproximadamente 30 caixas de papelão da minha mudança. Todas limpas e dobradas.",
    quantidade: "30 caixas",
    endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "pendente",
    aprovado: false,
    userId: joao.id,
    materialId: mat("Papel").id,
  });

  // 2. Pendente (segundo usuário)
  await upsertSolicitacao({
    titulo: "Garrafas PET e embalagens plásticas",
    descricao: "Acumulei várias garrafas PET e potes plásticos durante o mês. Estão ensacados.",
    quantidade: "2 sacos de 60L",
    endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "pendente",
    aprovado: false,
    userId: maria.id,
    materialId: mat("Plástico").id,
  });

  // 3. Aprovada (aguardando empresa aceitar)
  await upsertSolicitacao({
    titulo: "Latinhas de alumínio e sucata metálica",
    descricao: "Juntei latinhas de refrigerante e alguns pedaços de cano de cobre ao longo de 3 meses.",
    quantidade: "~5 kg",
    endereco: "Rua Augusta, 500 - Campinas, SP",
    status: "aprovada",
    aprovado: true,
    userId: carlos.id,
    materialId: mat("Metal").id,
  });

  // 4. Aprovada (segunda disponível para empresa)
  await upsertSolicitacao({
    titulo: "Vidros e garrafas de vinho",
    descricao: "Garrafas de vinho, potes de conserva e frascos de remédio. Separados por cor.",
    quantidade: "~8 kg",
    endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "aprovada",
    aprovado: true,
    userId: maria.id,
    materialId: mat("Vidro").id,
  });

  // 5. Rejeitada
  await upsertSolicitacao({
    titulo: "Colchão velho",
    descricao: "Um colchão de casal usado que não quero mais.",
    quantidade: "1 unidade",
    endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "rejeitada",
    aprovado: false,
    userId: joao.id,
    materialId: mat("Madeira").id,
  });

  // 6. Cancelada pelo cidadão
  await upsertSolicitacao({
    titulo: "Roupas velhas para doação/reciclagem",
    descricao: "Sacolas com roupas que não uso mais, incluindo sapatos e cintos.",
    quantidade: "3 sacolas",
    endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "cancelada",
    aprovado: false,
    userId: joao.id,
    materialId: mat("Têxtil").id,
  });

  console.log("✅ Solicitações pendentes, aprovadas, rejeitada e cancelada criadas");

  // ── Coleta aceita (em andamento) ───────────────────────────────────────────
  const solAceita = await prisma.solicitacaoColeta.create({
    data: {
      titulo: "Eletrônicos velhos",
      descricao: "Notebook quebrado, teclados, mouses e um monitor de tubo. Prontos para retirada.",
      quantidade: "~12 kg",
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      status: "aprovada",
      aprovado: true,
      userId: joao.id,
      materialId: mat("Eletrônicos").id,
    },
  });
  const coletaAceita = await prisma.coleta.create({
    data: {
      solicitacaoId: solAceita.id,
      companyId: empresa1.id,
      status: "aceita",
      codigoConfirmacao: "A1B2C3D4",
      dataPrevisaoColeta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.mensagem.createMany({
    data: [
      { coletaId: coletaAceita.id, remetenteId: emp1User.id, mensagem: "Olá! Confirmamos o aceite da sua solicitação. Estaremos aí em 2 dias." },
      { coletaId: coletaAceita.id, remetenteId: joao.id, mensagem: "Ótimo! Os equipamentos estarão na portaria." },
    ],
  });

  // ── Coleta a caminho ───────────────────────────────────────────────────────
  const solCaminho = await prisma.solicitacaoColeta.create({
    data: {
      titulo: "Óleo de cozinha usado",
      descricao: "Garrafas PET com óleo de fritura. Cada garrafa bem fechada e identificada.",
      quantidade: "6 garrafas de 1L",
      endereco: "Av. Paulista, 900 - São Paulo, SP",
      status: "aprovada",
      aprovado: true,
      userId: maria.id,
      materialId: mat("Óleo").id,
    },
  });
  const coletaCaminho = await prisma.coleta.create({
    data: {
      solicitacaoId: solCaminho.id,
      companyId: empresa2.id,
      status: "a_caminho",
      codigoConfirmacao: "E5F6G7H8",
      dataPrevisaoColeta: new Date(),
    },
  });
  await prisma.mensagem.createMany({
    data: [
      { coletaId: coletaCaminho.id, remetenteId: emp2User.id, mensagem: "Bom dia! Estamos a caminho, chegamos em aproximadamente 30 minutos." },
      { coletaId: coletaCaminho.id, remetenteId: maria.id, mensagem: "Perfeito, estarei em casa." },
      { coletaId: coletaCaminho.id, remetenteId: emp2User.id, mensagem: "Ótimo! Até já." },
    ],
  });

  // ── Coleta em coleta (coletando agora) ────────────────────────────────────
  const solEmColeta = await prisma.solicitacaoColeta.create({
    data: {
      titulo: "Pneus velhos de bicicleta",
      descricao: "4 pneus de bicicleta furados, não servem mais para uso.",
      quantidade: "4 unidades",
      endereco: "Rua Augusta, 500 - Campinas, SP",
      status: "aprovada",
      aprovado: true,
      userId: carlos.id,
      materialId: mat("Borracha").id,
    },
  });
  await prisma.coleta.create({
    data: {
      solicitacaoId: solEmColeta.id,
      companyId: empresa1.id,
      status: "em_coleta",
      codigoConfirmacao: "I9J0K1L2",
    },
  });

  // ── Coleta concluída COM avaliação ────────────────────────────────────────
  const solConcluidaAvaliada = await prisma.solicitacaoColeta.create({
    data: {
      titulo: "Papelão de supermercado",
      descricao: "Caixas recebidas nas compras do mês. Desmontadas e amarradas em fardos.",
      quantidade: "~15 kg",
      endereco: "Av. Paulista, 900 - São Paulo, SP",
      status: "aprovada",
      aprovado: true,
      userId: maria.id,
      materialId: mat("Papel").id,
    },
  });
  const coletaConcluidaAvaliada = await prisma.coleta.create({
    data: {
      solicitacaoId: solConcluidaAvaliada.id,
      companyId: empresa1.id,
      status: "concluida",
      codigoConfirmacao: "M3N4O5P6",
      dataAceite: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dataPrevisaoColeta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dataConclusao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.mensagem.createMany({
    data: [
      { coletaId: coletaConcluidaAvaliada.id, remetenteId: emp1User.id, mensagem: "Coleta realizada com sucesso! Obrigado." },
      { coletaId: coletaConcluidaAvaliada.id, remetenteId: maria.id, mensagem: "Ótimo atendimento, muito obrigada!" },
    ],
  });
  await prisma.avaliacao.create({
    data: {
      coletaId: coletaConcluidaAvaliada.id,
      autorId: maria.id,
      nota: 5,
      comentario: "Atendimento excelente, pontuais e muito educados. Recomendo!",
    },
  });

  // ── Coleta concluída SEM avaliação (para testar o formulário) ─────────────
  const solConcluidaSemAvaliacao = await prisma.solicitacaoColeta.create({
    data: {
      titulo: "Sucata de ferro e cobre",
      descricao: "Restos de instalação elétrica e pedaços de cano de ferro.",
      quantidade: "~8 kg",
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      status: "aprovada",
      aprovado: true,
      userId: joao.id,
      materialId: mat("Metal").id,
    },
  });
  const coletaConcluidaSemAvaliacao = await prisma.coleta.create({
    data: {
      solicitacaoId: solConcluidaSemAvaliacao.id,
      companyId: empresa2.id,
      status: "concluida",
      codigoConfirmacao: "Q7R8S9T0",
      dataAceite: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      dataPrevisaoColeta: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dataConclusao: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.mensagem.createMany({
    data: [
      { coletaId: coletaConcluidaSemAvaliacao.id, remetenteId: emp2User.id, mensagem: "Material recolhido! Até a próxima." },
    ],
  });

  // ── Coleta cancelada ───────────────────────────────────────────────────────
  const solCancelada = await prisma.solicitacaoColeta.create({
    data: {
      titulo: "Madeira de demolição",
      descricao: "Ripas e tábuas de madeira de uma reforma. Algumas ainda com pregos.",
      quantidade: "~20 kg",
      endereco: "Rua Augusta, 500 - Campinas, SP",
      status: "aprovada",
      aprovado: true,
      userId: carlos.id,
      materialId: mat("Madeira").id,
    },
  });
  await prisma.coleta.create({
    data: {
      solicitacaoId: solCancelada.id,
      companyId: empresa1.id,
      status: "cancelada",
      codigoConfirmacao: "U1V2W3X4",
    },
  });

  console.log("✅ Coletas criadas: aceita, a_caminho, em_coleta, concluída (com e sem avaliação), cancelada");

  // ── Avaliações adicionais para gerar média interessante na empresa1 ────────
  // Criamos mais coletas concluídas para empresa1 com avaliações variadas
  const notasExtra: [number, string][] = [
    [4, "Serviço muito bom, só atrasaram um pouco."],
    [5, "Super recomendo! Vieram rápido e fizeram tudo certo."],
    [3, "Ok, mas poderiam comunicar melhor o horário de chegada."],
    [4, ""],
  ];

  for (let i = 0; i < notasExtra.length; i++) {
    const [nota, comentario] = notasExtra[i];
    const userId = [joao.id, carlos.id, maria.id, joao.id][i];
    const sol = await prisma.solicitacaoColeta.create({
      data: {
        titulo: `Reciclagem histórico ${i + 1}`,
        descricao: "Material reciclável diverso.",
        quantidade: "~3 kg",
        endereco: "Endereço de teste",
        status: "aprovada",
        aprovado: true,
        userId,
        materialId: materiais[i % materiais.length].id,
      },
    });
    const col = await prisma.coleta.create({
      data: {
        solicitacaoId: sol.id,
        companyId: empresa1.id,
        status: "concluida",
        codigoConfirmacao: `HIST${i}000`,
        dataAceite: new Date(Date.now() - (12 + i) * 24 * 60 * 60 * 1000),
        dataConclusao: new Date(Date.now() - (10 + i) * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.avaliacao.create({
      data: {
        coletaId: col.id,
        autorId: userId,
        nota,
        comentario: comentario || undefined,
      },
    });
  }
  console.log("✅ Avaliações extras criadas para ReciclaMax");

  // ── Resumo ─────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("─────────────────────────────────────────────────────");
  console.log("Credenciais:");
  console.log("  Admin:    admin@recicla.com      / admin123");
  console.log("  Cidadão:  joao@example.com       / user123");
  console.log("  Cidadã:   maria@example.com      / user123");
  console.log("  Cidadão:  carlos@example.com     / user123");
  console.log("  Empresa:  empresa@recicla.com    / empresa123  (ReciclaMax)");
  console.log("  Empresa:  ecoverde@empresa.com   / empresa123  (EcoVerde)");
  console.log("─────────────────────────────────────────────────────");
  console.log("Solicitações criadas por estado:");
  console.log("  2x pendente | 2x aprovada (sem coleta) | 1x rejeitada | 1x cancelada");
  console.log("Coletas:");
  console.log("  aceita | a_caminho | em_coleta | concluída+avaliada | concluída sem avaliação | cancelada");
  console.log("  + 4 coletas históricas com avaliações para ReciclaMax");
  console.log("─────────────────────────────────────────────────────");
}

async function upsertSolicitacao(data: {
  titulo: string;
  descricao: string;
  quantidade: string;
  endereco: string;
  status: string;
  aprovado: boolean;
  userId: number;
  materialId: number;
}) {
  const existing = await prisma.solicitacaoColeta.findFirst({
    where: { titulo: data.titulo, userId: data.userId },
  });
  if (existing) return existing;
  return prisma.solicitacaoColeta.create({ data });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
