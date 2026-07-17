import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
  solicitacaoColeta: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  notificacao: {
    create: vi.fn(),
  },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  buscarSolicitacaoEmpresaDTO,
  buscarSolicitacaoPorId,
  criarSolicitacao,
  listarSolicitacoesAdmin,
  listarSolicitacoesAprovadas,
  listarSolicitacoesDoUsuario,
  listarSolicitacoesRecentes,
  removerSolicitacao,
} from "@/services/solicitacao.service";

describe("solicitacao.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("criarSolicitacao", () => {
    it("normaliza, remove duplicatas e cria a solicitação com imagens", async () => {
      prismaMock.solicitacaoColeta.create.mockResolvedValueOnce({ id: 10 });

      await criarSolicitacao(7, {
        titulo: "Coleta de plastico",
        descricao: "Descricao detalhada do material para coleta.",
        quantidade: "3 sacos",
        endereco: "Rua A, 100",
        materialId: 2,
        imagens: [
          " https://img.com/a.jpg ",
          "https://img.com/a.jpg",
          "",
          "https://img.com/b.jpg",
        ],
      });

      expect(prismaMock.solicitacaoColeta.create).toHaveBeenCalledWith({
        data: {
          titulo: "Coleta de plastico",
          descricao: "Descricao detalhada do material para coleta.",
          quantidade: "3 sacos",
          endereco: "Rua A, 100",
          materialId: 2,
          userId: 7,
          status: "aprovada",
          aprovado: true,
          imagens: {
            create: [
              { url: "https://img.com/a.jpg" },
              { url: "https://img.com/b.jpg" },
            ],
          },
        },
        include: { material: true, imagens: true },
      });
    });

    it("não envia bloco de imagens quando a lista vier vazia", async () => {
      prismaMock.solicitacaoColeta.create.mockResolvedValueOnce({ id: 11 });

      await criarSolicitacao(5, {
        titulo: "Coleta de vidro",
        descricao: "Descricao detalhada do material para coleta.",
        quantidade: "10 garrafas",
        endereco: "Rua B, 20",
        materialId: 4,
      });

      expect(prismaMock.solicitacaoColeta.create).toHaveBeenCalledWith({
        data: {
          titulo: "Coleta de vidro",
          descricao: "Descricao detalhada do material para coleta.",
          quantidade: "10 garrafas",
          endereco: "Rua B, 20",
          materialId: 4,
          userId: 5,
          status: "aprovada",
          aprovado: true,
          imagens: undefined,
        },
        include: { material: true, imagens: true },
      });
    });

    it("bloqueia quando mais de 5 imagens são informadas", async () => {
      await expect(
        criarSolicitacao(1, {
          titulo: "Coleta de metal",
          descricao: "Descricao detalhada do material para coleta.",
          quantidade: "20 kg",
          endereco: "Rua C, 33",
          materialId: 3,
          imagens: [
            "https://img.com/1.jpg",
            "https://img.com/2.jpg",
            "https://img.com/3.jpg",
            "https://img.com/4.jpg",
            "https://img.com/5.jpg",
            "https://img.com/6.jpg",
          ],
        })
      ).rejects.toThrow("Você pode adicionar no máximo 5 imagens por solicitação.");

      expect(prismaMock.solicitacaoColeta.create).not.toHaveBeenCalled();
    });
  });

  it("lista solicitações do usuário por data decrescente", async () => {
    await listarSolicitacoesDoUsuario(12);

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith({
      where: { userId: 12 },
      include: {
        material: true,
        imagens: true,
        coleta: { include: { company: { include: { user: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("busca solicitação filtrando por usuário quando informado", async () => {
    await buscarSolicitacaoPorId(8, 2);

    expect(prismaMock.solicitacaoColeta.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 8, userId: 2 },
      })
    );
  });

  it("lista solicitações recentes para o painel do admin", async () => {
    prismaMock.solicitacaoColeta.findMany.mockResolvedValueOnce([]);
    await listarSolicitacoesRecentes();

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith({
      where: { status: "aprovada" },
      include: {
        material: true,
        imagens: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  });

  it("lista todas as solicitações para gestão da admin", async () => {
    prismaMock.solicitacaoColeta.findMany.mockResolvedValueOnce([]);
    await listarSolicitacoesAdmin();

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          material: true,
          imagens: true,
          coleta: {
            select: {
              id: true,
              status: true,
              dataAceite: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );
    expect(JSON.stringify(prismaMock.solicitacaoColeta.findMany.mock.calls.at(-1)?.[0])).not.toContain("mensagens");
  });

  it("remove a solicitação e notifica o dono", async () => {
    prismaMock.solicitacaoColeta.update.mockResolvedValueOnce({
      id: 4,
      userId: 1,
      titulo: "Coleta de teste",
    });

    await removerSolicitacao(4);

    expect(prismaMock.solicitacaoColeta.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        aprovado: false,
        status: "removida",
      },
    });
    expect(prismaMock.notificacao.create).toHaveBeenCalledTimes(1);
  });

  it("lista apenas solicitações aprovadas e sem coleta para empresas", async () => {
    prismaMock.solicitacaoColeta.findMany.mockResolvedValueOnce([]);
    await listarSolicitacoesAprovadas();

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith({
      where: { aprovado: true, status: "aprovada", coleta: null },
      include: {
        material: true,
        imagens: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("empresa não recebe PII em solicitações disponíveis", async () => {
    prismaMock.solicitacaoColeta.findMany.mockResolvedValueOnce([
      {
        id: 1,
        titulo: "Coleta",
        descricao: "Material",
        quantidade: "2 sacos",
        endereco: "Rua Verde, 10, Bairro Centro, Campinas, SP",
        material: { id: 1, nome: "Papel" },
        imagens: [],
        user: { nome: "Nao deveria sair", email: "a@b.com", telefone: "11999999999" },
      },
    ]);

    const result = await listarSolicitacoesAprovadas();

    expect(JSON.stringify(result)).not.toContain("a@b.com");
    expect(JSON.stringify(result)).not.toContain("11999999999");
    expect(JSON.stringify(result)).not.toContain("Rua Verde");
    expect(result[0]).toMatchObject({
      id: 1,
      endereco: "Bairro Centro, Campinas",
      regiao: "Bairro Centro, Campinas",
    });
  });

  it("empresa só busca detalhe se disponível sem coleta ou se a coleta pertence a ela", async () => {
    await buscarSolicitacaoEmpresaDTO(55, 9);

    expect(prismaMock.solicitacaoColeta.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 55,
          OR: [
            { aprovado: true, status: "aprovada", coleta: null },
            { coleta: { companyId: 9 } },
          ],
        },
      })
    );
  });

  it("endpoint genérico de solicitação não inclui mensagens", async () => {
    await buscarSolicitacaoPorId(8, 2);

    const call = prismaMock.solicitacaoColeta.findFirst.mock.calls.at(-1)?.[0];
    expect(JSON.stringify(call)).not.toContain("mensagens");
  });
});
