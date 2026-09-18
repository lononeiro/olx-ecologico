import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";
const IMAGES_DIR = path.join(__dirname, "..", "imagens-reciclar");

// Solicitação/coleta a preservar (a que já foi testada manualmente na apresentação).
const SOLICITACAO_PRESERVADA_ID = 266;
const COLETA_PRESERVADA_ID = 239;

const daysAgo = (n: number, hours = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hours, 0, 0, 0);
  return d;
};
const daysFromNow = (n: number, hours = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
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
  const contentType = fileName.endsWith(".webp") ? "image/webp" : "image/jpeg";
  const blob = new Blob([buffer], { type: contentType });

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "olx-ecologico/seed-resende-demo");

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

/**
 * Remove todas as solicitações/coletas/conversas/mensagens/avaliações, EXCETO
 * as ligadas à solicitação/coleta preservada (já testada manualmente).
 * Usuários, empresas e materiais não são tocados.
 */
async function limparMantendoPreservada() {
  console.log(`🧹 Limpando tudo, exceto solicitação #${SOLICITACAO_PRESERVADA_ID} / coleta #${COLETA_PRESERVADA_ID}...`);

  await prisma.avaliacao.deleteMany({
    where: { coletaId: { not: COLETA_PRESERVADA_ID } },
  });
  await prisma.mensagem.deleteMany({
    where: { coletaId: { not: COLETA_PRESERVADA_ID } },
  });
  await prisma.mensagemPreAceite.deleteMany({
    where: { conversa: { solicitacaoId: { not: SOLICITACAO_PRESERVADA_ID } } },
  });
  await prisma.conversaSolicitacao.deleteMany({
    where: { solicitacaoId: { not: SOLICITACAO_PRESERVADA_ID } },
  });
  await prisma.coleta.deleteMany({
    where: { id: { not: COLETA_PRESERVADA_ID } },
  });
  await prisma.notificacao.deleteMany({});
  await prisma.solicitacaoImagem.deleteMany({
    where: { solicitacaoId: { not: SOLICITACAO_PRESERVADA_ID } },
  });
  await prisma.solicitacaoColeta.deleteMany({
    where: { id: { not: SOLICITACAO_PRESERVADA_ID } },
  });

  console.log("✅ Base limpa (usuários, empresas e materiais preservados)");
}

async function main() {
  console.log("🌱 Seed de demonstração (Resende/RJ) — iniciando...\n");

  await limparMantendoPreservada();

  const materiais = await prisma.materialTipo.findMany();
  const mat = (nome: string) => materiais.find((m) => m.nome.toLowerCase().includes(nome.toLowerCase()))!;

  // ── Usuários e empresas reais já existentes no banco ──────────────────────
  const users = await prisma.user.findMany({ where: { roleId: 1 } });
  const u = (email: string) => {
    const found = users.find((x) => x.email === email);
    if (!found) throw new Error(`Usuário não encontrado: ${email}`);
    return found;
  };
  const joao = u("joao@example.com");
  // Pedido do usuário: todas as solicitações ficam em nome do joao@example.com
  // e todas as coletas são aceitas pela empresa@recicla.com — os demais
  // "nomes" abaixo são apenas aliases para não reescrever os 15 blocos.
  const carlos = joao, maria = joao, ana = joao, bruno = joao, clara = joao,
    diego = joao, elena = joao, felipe = joao, monica = joao;

  const companies = await prisma.company.findMany({ include: { user: true } });
  const c = (email: string) => {
    const found = companies.find((x) => x.user.email === email);
    if (!found) throw new Error(`Empresa não encontrada: ${email}`);
    return found;
  };
  const reciclaMax = c("empresa@recicla.com");
  const ecoVerde = reciclaMax, coletaTudo = reciclaMax;

  console.log("\n📤 Enviando imagens de imagens-reciclar/ para o Cloudinary...");
  const [
    imgGeladeira, imgFogao, imgMaquinaLavar, imgGuardaRoupa,
    imgCama, imgMicroondas, imgPneu, imgNotebook,
  ] = await Promise.all([
    uploadToCloudinary("geladeira velha enferrujada.jpg"),
    uploadToCloudinary("fogão velho.jpg"),
    uploadToCloudinary("maquina de lavar quebrada.jpg"),
    uploadToCloudinary("guarda roupa velho.jpg"),
    uploadToCloudinary("cama de casal.webp"),
    uploadToCloudinary("micro-ondas antigo.jpg"),
    uploadToCloudinary("pneu.jpg"),
    uploadToCloudinary("notebook.jpg"),
  ]);
  console.log("✅ Imagens enviadas\n");

  const criarSolicitacao = async (data: {
    titulo: string; descricao: string; quantidade: string; endereco: string;
    userId: number; materialId: number; createdAt: Date; imagens?: string[];
  }) => {
    const sol = await prisma.solicitacaoColeta.create({
      data: {
        titulo: data.titulo, descricao: data.descricao, quantidade: data.quantidade,
        endereco: data.endereco, status: "aprovada", aprovado: true,
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

  const criarConversa = async (
    solicitacaoId: number, companyId: number, createdAt: Date,
    mensagens: { remetenteId: number; mensagem: string; createdAt: Date }[]
  ) => {
    const conversa = await prisma.conversaSolicitacao.create({
      data: { solicitacaoId, companyId, status: "aberta", createdAt, updatedAt: mensagens.at(-1)?.createdAt ?? createdAt },
    });
    await prisma.mensagemPreAceite.createMany({
      data: mensagens.map((m) => ({ conversaId: conversa.id, ...m })),
    });
    return conversa;
  };

  const criarColeta = async (opts: {
    solicitacaoId: number; companyId: number; status: string; codigoConfirmacao: string;
    dataAceite: Date; dataPrevisaoColeta?: Date; dataConclusao?: Date;
    mensagens?: { remetenteId: number; mensagem: string; createdAt: Date }[];
  }) => {
    const coleta = await prisma.coleta.create({
      data: {
        solicitacaoId: opts.solicitacaoId, companyId: opts.companyId, status: opts.status,
        codigoConfirmacao: opts.codigoConfirmacao, dataAceite: opts.dataAceite,
        dataPrevisaoColeta: opts.dataPrevisaoColeta, dataConclusao: opts.dataConclusao,
      },
    });
    if (opts.mensagens?.length) {
      await prisma.mensagem.createMany({
        data: opts.mensagens.map((m) => ({ coletaId: coleta.id, remetenteId: m.remetenteId, mensagem: m.mensagem, createdAt: m.createdAt })),
      });
    }
    return coleta;
  };

  // ── 1. Geladeira velha enferrujada — disponível, com conversa pré-aceite ──
  const sol1 = await criarSolicitacao({
    titulo: "Geladeira velha enferrujada para descarte",
    descricao: "Geladeira parou de funcionar há alguns meses, está enferrujada mas inteira para desmanche.",
    quantidade: "1 unidade",
    endereco: "Rua Sete de Setembro, 150, Vila Santa Cecília, Resende - RJ, CEP 27510-080",
    userId: carlos.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(6),
    imagens: [imgGeladeira],
  });
  await criarConversa(sol1.id, reciclaMax.id, daysAgo(5), [
    { remetenteId: reciclaMax.user.id, mensagem: "Olá! Vimos sua solicitação da geladeira. Ela ainda tem o gás refrigerante?", createdAt: daysAgo(5, 10) },
    { remetenteId: carlos.id, mensagem: "Não sei dizer ao certo, mas ela está inteira, só parou de gelar.", createdAt: daysAgo(5, 11) },
    { remetenteId: reciclaMax.user.id, mensagem: "Sem problemas, nós fazemos a retirada e o descarte correto de qualquer forma.", createdAt: daysAgo(5, 11) },
  ]);

  // ── 2. Fogão a gás enferrujado — coleta ACEITA ────────────────────────────
  const sol2 = await criarSolicitacao({
    titulo: "Fogão a gás enferrujado, 4 bocas",
    descricao: "Fogão antigo, bastante enferrujado, sem uso há mais de um ano.",
    quantidade: "1 unidade",
    endereco: "Avenida Presidente Vargas, 450, Campos Elíseos, Resende - RJ, CEP 27542-130",
    userId: maria.id, materialId: mat("Metal").id, createdAt: daysAgo(7),
    imagens: [imgFogao],
  });
  await criarColeta({
    solicitacaoId: sol2.id, companyId: reciclaMax.id, status: "aceita",
    codigoConfirmacao: "FG01AB23", dataAceite: daysAgo(1),
    dataPrevisaoColeta: daysFromNow(1),
    mensagens: [
      { remetenteId: reciclaMax.user.id, mensagem: "Bom dia Maria! Confirmamos o aceite do fogão, passamos amanhã.", createdAt: daysAgo(1, 9) },
      { remetenteId: maria.id, mensagem: "Perfeito, vou deixar ele na garagem pra facilitar.", createdAt: daysAgo(1, 10) },
    ],
  });

  // ── 3. Máquina de lavar quebrada — coleta A_CAMINHO ──────────────────────
  const sol3 = await criarSolicitacao({
    titulo: "Máquina de lavar roupa quebrada",
    descricao: "Máquina de lavar parou de centrifugar, motor com defeito.",
    quantidade: "1 unidade",
    endereco: "Avenida General Fonseca, 200, Vila Santa Cecília, Resende - RJ, CEP 27520-005",
    userId: joao.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(4),
    imagens: [imgMaquinaLavar],
  });
  await criarColeta({
    solicitacaoId: sol3.id, companyId: ecoVerde.id, status: "a_caminho",
    codigoConfirmacao: "ML02CD34", dataAceite: daysAgo(2),
    dataPrevisaoColeta: new Date(),
    mensagens: [
      { remetenteId: ecoVerde.user.id, mensagem: "Bom dia! Estamos a caminho para retirar a máquina de lavar.", createdAt: daysAgo(0, 8) },
      { remetenteId: joao.id, mensagem: "Combinado, estarei em casa te esperando.", createdAt: daysAgo(0, 8) },
    ],
  });

  // ── 4. Guarda-roupa velho — coleta EM_COLETA ─────────────────────────────
  const sol4 = await criarSolicitacao({
    titulo: "Guarda-roupa de madeira grande, 3 portas",
    descricao: "Guarda-roupa antigo de madeira maciça, um pouco desgastado mas inteiro.",
    quantidade: "1 unidade",
    endereco: "Rua Tiradentes, 80, Liberdade, Resende - RJ, CEP 27510-080",
    userId: ana.id, materialId: mat("Madeira").id, createdAt: daysAgo(5),
    imagens: [imgGuardaRoupa],
  });
  await criarColeta({
    solicitacaoId: sol4.id, companyId: coletaTudo.id, status: "em_coleta",
    codigoConfirmacao: "GR03EF45", dataAceite: daysAgo(1, 8),
    mensagens: [
      { remetenteId: coletaTudo.user.id, mensagem: "Chegamos! Estamos desmontando o guarda-roupa para o transporte.", createdAt: daysAgo(0, 10) },
      { remetenteId: ana.id, mensagem: "Show, qualquer coisa me chamem.", createdAt: daysAgo(0, 10) },
    ],
  });

  // ── 5. Cama de casal — coleta CONCLUÍDA, avaliação nos dois sentidos ─────
  const sol5 = await criarSolicitacao({
    titulo: "Cama de casal com estrutura de madeira",
    descricao: "Estrutura de cama de casal em madeira, colchão não incluso.",
    quantidade: "1 unidade",
    endereco: "Rua Dom Pedro I, 60, Liberdade, Resende - RJ, CEP 27510-080",
    userId: bruno.id, materialId: mat("Madeira").id, createdAt: daysAgo(10),
  });
  await prisma.solicitacaoImagem.createMany({ data: [{ solicitacaoId: sol5.id, url: imgCama }] });
  const coleta5 = await criarColeta({
    solicitacaoId: sol5.id, companyId: reciclaMax.id, status: "concluida",
    codigoConfirmacao: "CM04GH56", dataAceite: daysAgo(4), dataPrevisaoColeta: daysAgo(3), dataConclusao: daysAgo(2),
    mensagens: [
      { remetenteId: reciclaMax.user.id, mensagem: "Coleta realizada com sucesso, obrigado!", createdAt: daysAgo(2, 15) },
      { remetenteId: bruno.id, mensagem: "Muito obrigado pela agilidade!", createdAt: daysAgo(2, 16) },
    ],
  });
  await prisma.avaliacao.createMany({
    data: [
      { coletaId: coleta5.id, autorId: bruno.id, tipo: "usuario_para_empresa", nota: 5, comentario: "Equipe muito pontual e educada. Recomendo!", createdAt: daysAgo(2, 16) },
      { coletaId: coleta5.id, autorId: reciclaMax.user.id, tipo: "empresa_para_usuario", nota: 5, comentario: "Cliente muito organizado, item já estava pronto para retirada.", createdAt: daysAgo(2, 17) },
    ],
  });

  // ── 6. Micro-ondas antigo — coleta CONCLUÍDA, avaliação do usuário ───────
  const sol6 = await criarSolicitacao({
    titulo: "Micro-ondas antigo sem uso",
    descricao: "Micro-ondas parou de funcionar, sem uso há alguns meses.",
    quantidade: "1 unidade",
    endereco: "Avenida Duque de Caxias, 300, São Caetano, Resende - RJ, CEP 27510-080",
    userId: clara.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(12),
    imagens: [imgMicroondas],
  });
  const coleta6 = await criarColeta({
    solicitacaoId: sol6.id, companyId: ecoVerde.id, status: "concluida",
    codigoConfirmacao: "MO05IJ67", dataAceite: daysAgo(6), dataPrevisaoColeta: daysAgo(5), dataConclusao: daysAgo(4),
    mensagens: [
      { remetenteId: ecoVerde.user.id, mensagem: "Material recolhido! Até a próxima.", createdAt: daysAgo(4, 14) },
    ],
  });
  await prisma.avaliacao.create({
    data: { coletaId: coleta6.id, autorId: clara.id, tipo: "usuario_para_empresa", nota: 4, comentario: "Bom atendimento, só demorou um pouco mais que o combinado.", createdAt: daysAgo(4, 15) },
  });

  // ── 7. Pneus de carro — coleta CONCLUÍDA, avaliação nos dois sentidos ────
  const sol7 = await criarSolicitacao({
    titulo: "Pilha de pneus de carro usados",
    descricao: "6 pneus de carro fora de uso, acumulados na garagem.",
    quantidade: "6 unidades",
    endereco: "Rua Santos Dumont, 90, Nova Liberdade, Resende - RJ, CEP 27520-005",
    userId: diego.id, materialId: mat("Borracha").id, createdAt: daysAgo(15),
    imagens: [imgPneu],
  });
  const coleta7 = await criarColeta({
    solicitacaoId: sol7.id, companyId: coletaTudo.id, status: "concluida",
    codigoConfirmacao: "PN06KL78", dataAceite: daysAgo(8), dataPrevisaoColeta: daysAgo(7), dataConclusao: daysAgo(6),
    mensagens: [
      { remetenteId: coletaTudo.user.id, mensagem: "Coleta dos pneus concluída, obrigado por reciclar com a gente!", createdAt: daysAgo(6, 14) },
      { remetenteId: diego.id, mensagem: "Show, muito obrigado!", createdAt: daysAgo(6, 15) },
    ],
  });
  await prisma.avaliacao.createMany({
    data: [
      { coletaId: coleta7.id, autorId: diego.id, tipo: "usuario_para_empresa", nota: 5, comentario: "Super rápidos, recomendo!", createdAt: daysAgo(6, 15) },
      { coletaId: coleta7.id, autorId: coletaTudo.user.id, tipo: "empresa_para_usuario", nota: 4, comentario: "Tudo certo, só o acesso à garagem era um pouco apertado.", createdAt: daysAgo(6, 16) },
    ],
  });

  // ── 8. Computador desktop antigo — coleta CANCELADA ──────────────────────
  const sol8 = await criarSolicitacao({
    titulo: "Computador desktop antigo (CPU + monitor)",
    descricao: "CPU e monitor de tubo antigos, não ligam mais.",
    quantidade: "1 conjunto",
    endereco: "Avenida Rui Barbosa, 220, Liberdade, Resende - RJ, CEP 27510-080",
    userId: elena.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(9),
    imagens: [imgNotebook],
  });
  await criarColeta({
    solicitacaoId: sol8.id, companyId: reciclaMax.id, status: "cancelada",
    codigoConfirmacao: "PC07MN89", dataAceite: daysAgo(5),
    mensagens: [
      { remetenteId: reciclaMax.user.id, mensagem: "Olá, infelizmente tivemos um imprevisto na rota e precisamos cancelar essa coleta.", createdAt: daysAgo(4, 9) },
      { remetenteId: elena.id, mensagem: "Tudo bem, vou publicar novamente para outra empresa.", createdAt: daysAgo(4, 10) },
    ],
  });

  // ── 9. Sofá de 3 lugares — disponível, com conversa pré-aceite ───────────
  const sol9 = await criarSolicitacao({
    titulo: "Sofá de 3 lugares desmontado",
    descricao: "Sofá antigo desmontado, estofado gasto, estrutura de madeira ainda boa.",
    quantidade: "1 unidade (desmontado)",
    endereco: "Avenida Marechal Castelo Branco, 500, Jardim Tropical, Resende - RJ, CEP 27542-020",
    userId: felipe.id, materialId: mat("Têxtil").id, createdAt: daysAgo(3),
  });
  await criarConversa(sol9.id, ecoVerde.id, daysAgo(2), [
    { remetenteId: ecoVerde.user.id, mensagem: "Olá! Vimos o sofá desmontado, conseguem deixar na calçada no dia da coleta?", createdAt: daysAgo(2, 10) },
    { remetenteId: felipe.id, mensagem: "Consigo sim, sem problemas.", createdAt: daysAgo(2, 11) },
  ]);

  // ── 10. Colchão de casal — coleta ACEITA ─────────────────────────────────
  const sol10 = await criarSolicitacao({
    titulo: "Colchão de casal usado",
    descricao: "Colchão de casal com alguns anos de uso, sem manchas ou danos visíveis.",
    quantidade: "1 unidade",
    endereco: "Rua Frei Caneca, 40, Baixada da Olaria, Resende - RJ, CEP 27525-664",
    userId: monica.id, materialId: mat("Têxtil").id, createdAt: daysAgo(2),
  });
  await criarColeta({
    solicitacaoId: sol10.id, companyId: coletaTudo.id, status: "aceita",
    codigoConfirmacao: "CO08OP90", dataAceite: daysAgo(0, 9),
    dataPrevisaoColeta: daysFromNow(2),
    mensagens: [
      { remetenteId: coletaTudo.user.id, mensagem: "Aceitamos a coleta do colchão, passamos em dois dias.", createdAt: daysAgo(0, 9) },
      { remetenteId: monica.id, mensagem: "Combinado, obrigada!", createdAt: daysAgo(0, 9) },
    ],
  });

  // ── 11. TV de tubo antiga — coleta CONCLUÍDA, avaliação do usuário ──────
  const sol11 = await criarSolicitacao({
    titulo: "Televisão de tubo (CRT) antiga",
    descricao: "TV de tubo 29 polegadas, funcionando mas sem uso.",
    quantidade: "1 unidade",
    endereco: "Rua Dom Bosco, 100, Paraíso, Resende - RJ, CEP 27535-320",
    userId: carlos.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(18),
  });
  const coleta11 = await criarColeta({
    solicitacaoId: sol11.id, companyId: reciclaMax.id, status: "concluida",
    codigoConfirmacao: "TV09QR01", dataAceite: daysAgo(10), dataPrevisaoColeta: daysAgo(9), dataConclusao: daysAgo(8),
    mensagens: [
      { remetenteId: reciclaMax.user.id, mensagem: "TV recolhida com sucesso, obrigado!", createdAt: daysAgo(8, 14) },
    ],
  });
  await prisma.avaliacao.create({
    data: { coletaId: coleta11.id, autorId: carlos.id, tipo: "usuario_para_empresa", nota: 5, comentario: "Excelente atendimento, super recomendo.", createdAt: daysAgo(8, 15) },
  });

  // ── 12. Ar-condicionado de janela — coleta EM_COLETA ─────────────────────
  const sol12 = await criarSolicitacao({
    titulo: "Ar-condicionado de janela usado",
    descricao: "Ar-condicionado de janela antigo, parou de gelar direito.",
    quantidade: "1 unidade",
    endereco: "Avenida das Palmeiras, 150, Morada da Barra, Resende - RJ, CEP 27356-000",
    userId: maria.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(3),
  });
  await criarColeta({
    solicitacaoId: sol12.id, companyId: ecoVerde.id, status: "em_coleta",
    codigoConfirmacao: "AC10ST23", dataAceite: daysAgo(1, 8),
    mensagens: [
      { remetenteId: ecoVerde.user.id, mensagem: "Estamos retirando o ar-condicionado agora.", createdAt: daysAgo(0, 11) },
    ],
  });

  // ── 13. Bateria de carro — disponível, com conversa pré-aceite ──────────
  const sol13 = await criarSolicitacao({
    titulo: "Bateria de carro usada",
    descricao: "Bateria automotiva usada, descartada corretamente após troca.",
    quantidade: "1 unidade",
    endereco: "Rua Ouro Preto, 33, Fazenda da Barra 2, Resende - RJ, CEP 27356-000",
    userId: joao.id, materialId: mat("Metal").id, createdAt: daysAgo(1),
  });
  await criarConversa(sol13.id, coletaTudo.id, daysAgo(0, 8), [
    { remetenteId: coletaTudo.user.id, mensagem: "Boa tarde! Fazemos a coleta de baterias automotivas, podemos buscar amanhã?", createdAt: daysAgo(0, 14) },
    { remetenteId: joao.id, mensagem: "Pode ser sim, qualquer horário da manhã.", createdAt: daysAgo(0, 15) },
  ]);

  // ── 14. Estante de madeira — coleta A_CAMINHO ────────────────────────────
  const sol14 = await criarSolicitacao({
    titulo: "Estante de madeira / prateleira grande",
    descricao: "Estante de madeira com 5 prateleiras, um pouco desgastada.",
    quantidade: "1 unidade",
    endereco: "Rua Minas Gerais, 77, Nova Liberdade, Resende - RJ, CEP 27520-005",
    userId: ana.id, materialId: mat("Madeira").id, createdAt: daysAgo(4),
  });
  await criarColeta({
    solicitacaoId: sol14.id, companyId: reciclaMax.id, status: "a_caminho",
    codigoConfirmacao: "ES11UV45", dataAceite: daysAgo(2),
    dataPrevisaoColeta: new Date(),
    mensagens: [
      { remetenteId: reciclaMax.user.id, mensagem: "Estamos a caminho para retirar a estante!", createdAt: daysAgo(0, 9) },
    ],
  });

  // ── 15. Ventilador de pé — coleta CONCLUÍDA, avaliação da empresa ────────
  const sol15 = await criarSolicitacao({
    titulo: "Ventilador de pé quebrado",
    descricao: "Ventilador de pé com o motor queimado, base e hélice inteiras.",
    quantidade: "1 unidade",
    endereco: "Rua Bahia, 22, Vila Santa Cecília, Resende - RJ, CEP 27520-005",
    userId: bruno.id, materialId: mat("Eletrônicos").id, createdAt: daysAgo(16),
  });
  const coleta15 = await criarColeta({
    solicitacaoId: sol15.id, companyId: ecoVerde.id, status: "concluida",
    codigoConfirmacao: "VT12WX67", dataAceite: daysAgo(9), dataPrevisaoColeta: daysAgo(8), dataConclusao: daysAgo(7),
    mensagens: [
      { remetenteId: ecoVerde.user.id, mensagem: "Ventilador recolhido, obrigado!", createdAt: daysAgo(7, 14) },
    ],
  });
  await prisma.avaliacao.create({
    data: { coletaId: coleta15.id, autorId: ecoVerde.user.id, tipo: "empresa_para_usuario", nota: 4, comentario: "Item já separado, só demorou um pouco para atender na porta.", createdAt: daysAgo(7, 15) },
  });

  // ── Resumo ─────────────────────────────────────────────────────────────
  const total = await prisma.solicitacaoColeta.count();
  const totalColetas = await prisma.coleta.count();
  const totalMsg = (await prisma.mensagem.count()) + (await prisma.mensagemPreAceite.count());
  const totalAval = await prisma.avaliacao.count();
  console.log("\n🎉 Seed de demonstração (Resende/RJ) concluído com sucesso!");
  console.log("─────────────────────────────────────────────────────");
  console.log(`Solicitações: ${total} | Coletas: ${totalColetas} | Mensagens: ${totalMsg} | Avaliações: ${totalAval}`);
  console.log(`Preservada: solicitação #${SOLICITACAO_PRESERVADA_ID} / coleta #${COLETA_PRESERVADA_ID}`);
  console.log("─────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
