import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";
const IMAGES_DIR = path.join(__dirname, "..", "imagens-reciclar");

const daysAgo = (n: number, hours = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, 0, 0, 0);
  return d;
};

async function uploadToCloudinary(fileName: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET não configuradas."
    );
  }

  const filePath = path.join(IMAGES_DIR, fileName);
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "olx-ecologico/seed-demo");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const data = (await response.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!response.ok || typeof data?.secure_url !== "string") {
    throw new Error(
      `Falha ao enviar ${fileName} para o Cloudinary: ${data?.error?.message ?? response.statusText}`
    );
  }
  console.log(`  ↳ ${fileName} enviada: ${data.secure_url}`);
  return data.secure_url as string;
}

async function limparRegistrosDeColeta() {
  console.log("🧹 Limpando registros de solicitações/coletas/mensagens/avaliações...");
  await prisma.avaliacao.deleteMany({});
  await prisma.mensagem.deleteMany({});
  await prisma.mensagemPreAceite.deleteMany({});
  await prisma.conversaSolicitacao.deleteMany({});
  await prisma.coleta.deleteMany({});
  await prisma.notificacao.deleteMany({});
  await prisma.solicitacaoImagem.deleteMany({});
  await prisma.solicitacaoColeta.deleteMany({});
  console.log("✅ Base de solicitações zerada (usuários e empresas preservados)");
}

async function garantirUsuariosBase() {
  await Promise.all([
    prisma.role.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nome: "usuario" } }),
    prisma.role.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nome: "admin" } }),
    prisma.role.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nome: "empresa" } }),
  ]);

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

  const bcrypt = await import("bcryptjs");
  const senhaUser = await bcrypt.hash("user123", 12);
  const senhaEmpresa = await bcrypt.hash("empresa123", 12);
  const adminHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@recicla.com" },
    update: {},
    create: { nome: "Administrador", email: "admin@recicla.com", senhaHash: adminHash, roleId: 2, status: "ativo" },
  });

  const joao = await prisma.user.upsert({
    where: { email: "joao@example.com" },
    update: {},
    create: { nome: "João Silva", email: "joao@example.com", senhaHash: senhaUser, endereco: "Rua das Flores, 123 - São Paulo, SP", telefone: "11999990000", roleId: 1, status: "ativo" },
  });
  const maria = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: {},
    create: { nome: "Maria Oliveira", email: "maria@example.com", senhaHash: senhaUser, endereco: "Av. Paulista, 900 - São Paulo, SP", telefone: "11988880001", roleId: 1, status: "ativo" },
  });
  const carlos = await prisma.user.upsert({
    where: { email: "carlos@example.com" },
    update: {},
    create: { nome: "Carlos Mendes", email: "carlos@example.com", senhaHash: senhaUser, endereco: "Rua Augusta, 500 - Campinas, SP", telefone: "19977770002", roleId: 1, status: "ativo" },
  });
  const ana = await prisma.user.upsert({
    where: { email: "ana@example.com" },
    update: {},
    create: { nome: "Ana Beatriz Costa", email: "ana@example.com", senhaHash: senhaUser, endereco: "Rua dos Ipês, 45 - São Paulo, SP", telefone: "11966660003", roleId: 1, status: "ativo" },
  });

  const emp1User = await prisma.user.upsert({
    where: { email: "empresa@recicla.com" },
    update: {},
    create: { nome: "ReciclaMax Ltda", email: "empresa@recicla.com", senhaHash: senhaEmpresa, roleId: 3, status: "ativo" },
  });
  const empresa1 = await prisma.company.upsert({
    where: { userId: emp1User.id },
    update: {},
    create: { userId: emp1User.id, cnpj: "12.345.678/0001-90", descricao: "Especializada em coleta e reciclagem de materiais domésticos e industriais." },
  });

  const emp2User = await prisma.user.upsert({
    where: { email: "ecoverde@empresa.com" },
    update: {},
    create: { nome: "EcoVerde Soluções", email: "ecoverde@empresa.com", senhaHash: senhaEmpresa, roleId: 3, status: "ativo" },
  });
  const empresa2 = await prisma.company.upsert({
    where: { userId: emp2User.id },
    update: {},
    create: { userId: emp2User.id, cnpj: "98.765.432/0001-11", descricao: "Coleta seletiva para condomínios e empresas. Atuamos em toda a região metropolitana." },
  });

  const materiais = await prisma.materialTipo.findMany();
  return { joao, maria, carlos, ana, emp1User, empresa1, emp2User, empresa2, materiais };
}

async function main() {
  console.log("🌱 Seed de demonstração (TCC) — iniciando...\n");

  await limparRegistrosDeColeta();
  const { joao, maria, carlos, ana, emp1User, empresa1, emp2User, empresa2, materiais } =
    await garantirUsuariosBase();
  const mat = (nome: string) => materiais.find((m) => m.nome.toLowerCase().includes(nome.toLowerCase()))!;

  console.log("\n📤 Enviando imagens de imagens-reciclar/ para o Cloudinary...");
  const [imgGarrafas, imgGeladeira, imgNotebook, imgPneu] = await Promise.all([
    uploadToCloudinary("garrafas.jpg"),
    uploadToCloudinary("geladeira.jpg"),
    uploadToCloudinary("notebook.jpg"),
    uploadToCloudinary("pneu.jpg"),
  ]);

  const criarSolicitacao = async (data: {
    titulo: string; descricao: string; quantidade: string; endereco: string;
    status: string; aprovado: boolean; userId: number; materialId: number;
    createdAt: Date; imagens?: string[];
  }) => {
    const sol = await prisma.solicitacaoColeta.create({
      data: {
        titulo: data.titulo, descricao: data.descricao, quantidade: data.quantidade,
        endereco: data.endereco, status: data.status, aprovado: data.aprovado,
        userId: data.userId, materialId: data.materialId, createdAt: data.createdAt,
      },
    });
    if (data.imagens?.length) {
      await prisma.solicitacaoImagem.createMany({
        data: data.imagens.map((url) => ({ solicitacaoId: sol.id, url })),
      });
    }
    return sol;
  };

  // ── 1. PENDENTES (aguardando moderação) ──────────────────────────────────
  await criarSolicitacao({
    titulo: "Restos de poda de jardim",
    descricao: "Galhos, folhas secas e grama cortada de uma limpeza no quintal.",
    quantidade: "~25 kg", endereco: "Rua dos Ipês, 45 - São Paulo, SP",
    status: "pendente", aprovado: false, userId: ana.id, materialId: mat("Orgânico").id,
    createdAt: daysAgo(0, 8),
  });
  await criarSolicitacao({
    titulo: "Móveis de madeira desmontados",
    descricao: "Estante e mesa de madeira MDF desmontadas após reforma.",
    quantidade: "2 peças", endereco: "Rua Augusta, 500 - Campinas, SP",
    status: "pendente", aprovado: false, userId: carlos.id, materialId: mat("Madeira").id,
    createdAt: daysAgo(0, 11),
  });

  // ── 2. REJEITADA ──────────────────────────────────────────────────────────
  await criarSolicitacao({
    titulo: "Lixo eletrônico misturado com lixo comum",
    descricao: "Solicitação recusada por não separar corretamente os materiais recicláveis.",
    quantidade: "1 saco misto", endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "rejeitada", aprovado: false, userId: maria.id, materialId: mat("Eletrônicos").id,
    createdAt: daysAgo(20),
  });

  // ── 3. REMOVIDA pela administração ───────────────────────────────────────
  await criarSolicitacao({
    titulo: "Colchão velho",
    descricao: "Um colchão de casal usado que não quero mais.",
    quantidade: "1 unidade", endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "removida", aprovado: false, userId: joao.id, materialId: mat("Madeira").id,
    createdAt: daysAgo(18),
  });

  // ── 4. CANCELADA pelo cidadão (sem coleta) ───────────────────────────────
  await criarSolicitacao({
    titulo: "Roupas velhas para doação/reciclagem",
    descricao: "Sacolas com roupas que não uso mais, incluindo sapatos e cintos.",
    quantidade: "3 sacolas", endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "cancelada", aprovado: false, userId: joao.id, materialId: mat("Têxtil").id,
    createdAt: daysAgo(15),
  });

  // ── 5. APROVADAS disponíveis no mercado, com CONVERSAS pré-aceite ────────
  const solGarrafas = await criarSolicitacao({
    titulo: "Garrafas PET e embalagens plásticas",
    descricao: "Acumulei várias garrafas PET e potes plásticos durante o mês. Estão ensacados e lavados.",
    quantidade: "2 sacos de 60L", endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: maria.id, materialId: mat("Plástico").id,
    createdAt: daysAgo(6), imagens: [imgGarrafas],
  });
  const solVidros = await criarSolicitacao({
    titulo: "Vidros e garrafas de vinho",
    descricao: "Garrafas de vinho, potes de conserva e frascos de remédio. Separados por cor.",
    quantidade: "~8 kg", endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: maria.id, materialId: mat("Vidro").id,
    createdAt: daysAgo(4), imagens: [imgGarrafas],
  });
  const solMetal = await criarSolicitacao({
    titulo: "Latinhas de alumínio e sucata metálica",
    descricao: "Juntei latinhas de refrigerante e alguns pedaços de cano de cobre ao longo de 3 meses.",
    quantidade: "~5 kg", endereco: "Rua Augusta, 500 - Campinas, SP",
    status: "aprovada", aprovado: true, userId: carlos.id, materialId: mat("Metal").id,
    createdAt: daysAgo(3),
  });

  const criarConversa = async (
    solicitacaoId: number, companyId: number, status: string,
    createdAt: Date, updatedAt: Date,
    mensagens: { remetenteId: number; mensagem: string; createdAt: Date }[]
  ) => {
    const conversa = await prisma.conversaSolicitacao.create({
      data: { solicitacaoId, companyId, status, createdAt, updatedAt },
    });
    await prisma.mensagemPreAceite.createMany({
      data: mensagens.map((m) => ({ conversaId: conversa.id, ...m })),
    });
    return conversa;
  };

  await criarConversa(solGarrafas.id, empresa1.id, "aberta", daysAgo(5), daysAgo(5, 10), [
    { remetenteId: emp1User.id, mensagem: "Olá Maria! Vimos sua solicitação de garrafas PET. Você teria disponibilidade essa semana?", createdAt: daysAgo(5, 9) },
    { remetenteId: maria.id, mensagem: "Oi! Sim, qualquer dia após as 14h estou em casa.", createdAt: daysAgo(5, 9, ), },
    { remetenteId: emp1User.id, mensagem: "Perfeito, vamos avaliar a rota e te confirmamos por aqui.", createdAt: daysAgo(5, 10) },
  ].map((m) => ({ remetenteId: m.remetenteId, mensagem: m.mensagem, createdAt: m.createdAt })));

  await criarConversa(solGarrafas.id, empresa2.id, "aberta", daysAgo(2), daysAgo(2, 16), [
    { remetenteId: emp2User.id, mensagem: "Bom dia! A EcoVerde também atende sua região, gostaríamos de fazer a coleta.", createdAt: daysAgo(2, 15) },
    { remetenteId: maria.id, mensagem: "Obrigada pelo contato! Já estou conversando com outra empresa, mas se não fechar te aviso.", createdAt: daysAgo(2, 16) },
  ]);

  await criarConversa(solVidros.id, empresa2.id, "aberta", daysAgo(3), daysAgo(3, 12), [
    { remetenteId: emp2User.id, mensagem: "Olá! Podemos passar amanhã de manhã para retirar os vidros?", createdAt: daysAgo(3, 11) },
    { remetenteId: maria.id, mensagem: "Pode ser sim, das 8h às 11h eu estou em casa.", createdAt: daysAgo(3, 11, ) },
    { remetenteId: emp2User.id, mensagem: "Combinado, vamos formalizar o aceite pelo sistema.", createdAt: daysAgo(3, 12) },
  ].map((m) => ({ remetenteId: m.remetenteId, mensagem: m.mensagem, createdAt: m.createdAt })));

  await criarConversa(solMetal.id, empresa1.id, "aberta", daysAgo(2), daysAgo(1, 9), [
    { remetenteId: carlos.id, mensagem: "Boa tarde! Vi que vocês fazem coleta de metais em Campinas, é isso mesmo?", createdAt: daysAgo(2, 14) },
    { remetenteId: emp1User.id, mensagem: "Sim! Atendemos toda a região. Podemos ir buscar na quinta-feira.", createdAt: daysAgo(1, 9) },
  ]);

  console.log("✅ Solicitações pendentes/rejeitada/removida/cancelada/disponíveis + conversas pré-aceite criadas");

  // ── 6. Fluxo completo de COLETAS (todas as fases) ────────────────────────
  const criarColetaComMensagens = async (opts: {
    solicitacaoId: number; companyId: number; status: string; codigoConfirmacao: string;
    dataAceite: Date; dataPrevisaoColeta?: Date; dataConclusao?: Date;
    mensagens: { remetenteId: number; mensagem: string; createdAt: Date }[];
  }) => {
    const coleta = await prisma.coleta.create({
      data: {
        solicitacaoId: opts.solicitacaoId, companyId: opts.companyId, status: opts.status,
        codigoConfirmacao: opts.codigoConfirmacao, dataAceite: opts.dataAceite,
        dataPrevisaoColeta: opts.dataPrevisaoColeta, dataConclusao: opts.dataConclusao,
      },
    });
    if (opts.mensagens.length) {
      await prisma.mensagem.createMany({
        data: opts.mensagens.map((m) => ({ coletaId: coleta.id, remetenteId: m.remetenteId, mensagem: m.mensagem, createdAt: m.createdAt })),
      });
    }
    return coleta;
  };

  // 6.1 ACEITA
  const solEletronicos = await criarSolicitacao({
    titulo: "Eletrônicos velhos", descricao: "Notebook quebrado, teclados, mouses e um monitor de tubo. Prontos para retirada.",
    quantidade: "~12 kg", endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: joao.id, materialId: mat("Eletrônicos").id,
    createdAt: daysAgo(5), imagens: [imgNotebook],
  });
  await criarColetaComMensagens({
    solicitacaoId: solEletronicos.id, companyId: empresa1.id, status: "aceita",
    codigoConfirmacao: "A1B2C3D4", dataAceite: daysAgo(1),
    dataPrevisaoColeta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    mensagens: [
      { remetenteId: emp1User.id, mensagem: "Olá João! Confirmamos o aceite da sua solicitação. Estaremos aí em 2 dias.", createdAt: daysAgo(1, 10) },
      { remetenteId: joao.id, mensagem: "Ótimo! Os equipamentos estarão na portaria.", createdAt: daysAgo(1, 11) },
      { remetenteId: emp1User.id, mensagem: "Combinado, obrigado pela agilidade!", createdAt: daysAgo(1, 11) },
    ],
  });

  // 6.2 ACEITA (segunda, geladeira)
  const solGeladeira = await criarSolicitacao({
    titulo: "Geladeira antiga sem uso", descricao: "Geladeira pequena parou de gelar, mas está inteira para desmanche e reciclagem de componentes.",
    quantidade: "1 unidade", endereco: "Rua dos Ipês, 45 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: ana.id, materialId: mat("Eletrônicos").id,
    createdAt: daysAgo(4), imagens: [imgGeladeira],
  });
  await criarColetaComMensagens({
    solicitacaoId: solGeladeira.id, companyId: empresa2.id, status: "aceita",
    codigoConfirmacao: "AC12EF34", dataAceite: daysAgo(0, 9),
    dataPrevisaoColeta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    mensagens: [
      { remetenteId: emp2User.id, mensagem: "Bom dia Ana! Aceitamos a coleta da geladeira, vamos precisar de 2 pessoas para o transporte.", createdAt: daysAgo(0, 9) },
      { remetenteId: ana.id, mensagem: "Sem problemas, ela está no térreo, é fácil acesso.", createdAt: daysAgo(0, 9) },
    ],
  });

  // 6.3 A_CAMINHO
  const solOleo = await criarSolicitacao({
    titulo: "Óleo de cozinha usado", descricao: "Garrafas PET com óleo de fritura. Cada garrafa bem fechada e identificada.",
    quantidade: "6 garrafas de 1L", endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: maria.id, materialId: mat("Óleo").id,
    createdAt: daysAgo(7),
  });
  await criarColetaComMensagens({
    solicitacaoId: solOleo.id, companyId: empresa2.id, status: "a_caminho",
    codigoConfirmacao: "E5F6G7H8", dataAceite: daysAgo(2), dataPrevisaoColeta: new Date(),
    mensagens: [
      { remetenteId: emp2User.id, mensagem: "Bom dia! Estamos a caminho, chegamos em aproximadamente 30 minutos.", createdAt: daysAgo(0, 8) },
      { remetenteId: maria.id, mensagem: "Perfeito, estarei em casa.", createdAt: daysAgo(0, 8) },
      { remetenteId: emp2User.id, mensagem: "Ótimo! Até já.", createdAt: daysAgo(0, 8) },
    ],
  });

  // 6.4 EM_COLETA
  const solPneus = await criarSolicitacao({
    titulo: "Pneus velhos de bicicleta", descricao: "4 pneus de bicicleta furados, não servem mais para uso.",
    quantidade: "4 unidades", endereco: "Rua Augusta, 500 - Campinas, SP",
    status: "aprovada", aprovado: true, userId: carlos.id, materialId: mat("Borracha").id,
    createdAt: daysAgo(6), imagens: [imgPneu],
  });
  await criarColetaComMensagens({
    solicitacaoId: solPneus.id, companyId: empresa1.id, status: "em_coleta",
    codigoConfirmacao: "I9J0K1L2", dataAceite: daysAgo(1, 8),
    mensagens: [
      { remetenteId: emp1User.id, mensagem: "Chegamos! Estamos retirando os pneus agora.", createdAt: daysAgo(0, 10) },
      { remetenteId: carlos.id, mensagem: "Show, qualquer coisa me chama, estou em casa.", createdAt: daysAgo(0, 10) },
    ],
  });

  // 6.5 CONCLUÍDA com avaliação (nota 5)
  const solPapelao = await criarSolicitacao({
    titulo: "Papelão de supermercado", descricao: "Caixas recebidas nas compras do mês. Desmontadas e amarradas em fardos.",
    quantidade: "~15 kg", endereco: "Av. Paulista, 900 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: maria.id, materialId: mat("Papel").id,
    createdAt: daysAgo(10),
  });
  const coletaPapelao = await criarColetaComMensagens({
    solicitacaoId: solPapelao.id, companyId: empresa1.id, status: "concluida",
    codigoConfirmacao: "M3N4O5P6",
    dataAceite: daysAgo(4), dataPrevisaoColeta: daysAgo(3), dataConclusao: daysAgo(2),
    mensagens: [
      { remetenteId: emp1User.id, mensagem: "Coleta realizada com sucesso! Obrigado.", createdAt: daysAgo(2, 15) },
      { remetenteId: maria.id, mensagem: "Ótimo atendimento, muito obrigada!", createdAt: daysAgo(2, 16) },
    ],
  });
  await prisma.avaliacao.create({
    data: { coletaId: coletaPapelao.id, autorId: maria.id, nota: 5, comentario: "Atendimento excelente, pontuais e muito educados. Recomendo!", createdAt: daysAgo(2, 16) },
  });

  // 6.6 CONCLUÍDA sem avaliação
  const solSucata = await criarSolicitacao({
    titulo: "Sucata de ferro e cobre", descricao: "Restos de instalação elétrica e pedaços de cano de ferro.",
    quantidade: "~8 kg", endereco: "Rua das Flores, 123 - São Paulo, SP",
    status: "aprovada", aprovado: true, userId: joao.id, materialId: mat("Metal").id,
    createdAt: daysAgo(12),
  });
  await criarColetaComMensagens({
    solicitacaoId: solSucata.id, companyId: empresa2.id, status: "concluida",
    codigoConfirmacao: "Q7R8S9T0",
    dataAceite: daysAgo(6), dataPrevisaoColeta: daysAgo(5), dataConclusao: daysAgo(4),
    mensagens: [
      { remetenteId: emp2User.id, mensagem: "Material recolhido! Até a próxima.", createdAt: daysAgo(4, 14) },
    ],
  });

  // 6.7 CANCELADA
  const solMadeira = await criarSolicitacao({
    titulo: "Madeira de demolição", descricao: "Ripas e tábuas de madeira de uma reforma. Algumas ainda com pregos.",
    quantidade: "~20 kg", endereco: "Rua Augusta, 500 - Campinas, SP",
    status: "aprovada", aprovado: true, userId: carlos.id, materialId: mat("Madeira").id,
    createdAt: daysAgo(9),
  });
  await criarColetaComMensagens({
    solicitacaoId: solMadeira.id, companyId: empresa1.id, status: "cancelada",
    codigoConfirmacao: "U1V2W3X4", dataAceite: daysAgo(5),
    mensagens: [
      { remetenteId: emp1User.id, mensagem: "Olá, infelizmente tivemos um imprevisto na rota e precisamos cancelar essa coleta.", createdAt: daysAgo(4, 9) },
      { remetenteId: carlos.id, mensagem: "Tudo bem, sem problemas. Vou publicar novamente para outra empresa.", createdAt: daysAgo(4, 10) },
    ],
  });

  console.log("✅ Coletas criadas cobrindo todas as fases: aceita, a_caminho, em_coleta, concluída (com/sem avaliação), cancelada");

  // ── 7. Avaliações extras para média histórica da ReciclaMax ──────────────
  const notasExtra: [number, string][] = [
    [4, "Serviço muito bom, só atrasaram um pouco."],
    [5, "Super recomendo! Vieram rápido e fizeram tudo certo."],
    [3, "Ok, mas poderiam comunicar melhor o horário de chegada."],
    [5, "Equipe muito educada e cuidadosa com o material."],
  ];
  const usuariosExtra = [joao, carlos, maria, ana];
  for (let i = 0; i < notasExtra.length; i++) {
    const [nota, comentario] = notasExtra[i];
    const userId = usuariosExtra[i].id;
    const sol = await criarSolicitacao({
      titulo: `Reciclagem histórica ${i + 1}`, descricao: "Material reciclável diverso, coleta recorrente mensal.",
      quantidade: "~3 kg", endereco: "Endereço de teste", status: "aprovada", aprovado: true,
      userId, materialId: materiais[i % materiais.length].id, createdAt: daysAgo(20 + i),
    });
    const col = await criarColetaComMensagens({
      solicitacaoId: sol.id, companyId: empresa1.id, status: "concluida",
      codigoConfirmacao: `HIST${i}000`,
      dataAceite: daysAgo(14 + i), dataConclusao: daysAgo(12 + i),
      mensagens: [
        { remetenteId: emp1User.id, mensagem: "Coleta concluída, obrigado por reciclar com a gente!", createdAt: daysAgo(12 + i, 15) },
      ],
    });
    await prisma.avaliacao.create({
      data: { coletaId: col.id, autorId: userId, nota, comentario: comentario || undefined, createdAt: daysAgo(12 + i, 16) },
    });
  }
  console.log("✅ Avaliações históricas extras criadas para ReciclaMax");

  // ── Resumo ─────────────────────────────────────────────────────────────────
  const total = await prisma.solicitacaoColeta.count();
  const totalColetas = await prisma.coleta.count();
  const totalMsg = (await prisma.mensagem.count()) + (await prisma.mensagemPreAceite.count());
  console.log("\n🎉 Seed de demonstração concluído com sucesso!");
  console.log("─────────────────────────────────────────────────────");
  console.log(`Solicitações: ${total} | Coletas: ${totalColetas} | Mensagens (total): ${totalMsg}`);
  console.log("Fases de solicitação cobertas: pendente, aprovada, rejeitada, cancelada, removida");
  console.log("Fases de coleta cobertas: aceita, a_caminho, em_coleta, concluída (com/sem avaliação), cancelada");
  console.log("Usuários (não alterados/preservados): joao, maria, carlos, ana, admin, ReciclaMax, EcoVerde");
  console.log("─────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
