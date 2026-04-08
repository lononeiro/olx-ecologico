import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
  solicitacaoColeta: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  atualizarStatusSolicitacao,
  buscarSolicitacaoPorId,
  criarSolicitacao,
  getAdminSolicitacaoScope,
  listarSolicitacoesAdmin,
  listarSolicitacoesAprovadas,
  listarSolicitacoesDoUsuario,
  listarSolicitacoesPendentes,
} from "@/services/solicitacao.service";

describe("solicitacao.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("criarSolicitacao", () => {
    it("normaliza, remove duplicatas e cria a solicitacao com imagens", async () => {
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
          status: "pendente",
          aprovado: false,
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

    it("nao envia bloco de imagens quando a lista vier vazia", async () => {
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
          status: "pendente",
          aprovado: false,
          imagens: undefined,
        },
        include: { material: true, imagens: true },
      });
    });

    it("bloqueia quando mais de 5 imagens sao informadas", async () => {
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
      ).rejects.toThrow("Voce pode adicionar no maximo 5 imagens por solicitacao.");

      expect(prismaMock.solicitacaoColeta.create).not.toHaveBeenCalled();
    });
  });

  it("lista solicitacoes do usuario por data decrescente", async () => {
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

  it("busca solicitacao filtrando por usuario quando informado", async () => {
    await buscarSolicitacaoPorId(8, 2);

    expect(prismaMock.solicitacaoColeta.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 8, userId: 2 },
      })
    );
  });

  it("lista solicitacoes pendentes de aprovacao", async () => {
    await listarSolicitacoesPendentes();

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith({
      where: { status: "pendente", aprovado: false },
      include: {
        user: { select: { id: true, nome: true, email: true } },
        material: true,
        imagens: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("lista a fila operacional da admin", async () => {
    const now = new Date("2026-04-08T12:00:00.000Z");
    await listarSolicitacoesAdmin();

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          user: { select: { id: true, nome: true, email: true } },
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

    expect(getAdminSolicitacaoScope(now)).toEqual({
      OR: [
        { status: "rejeitada" },
        { status: "aprovada", aprovado: true, coleta: null },
        {
          status: "pendente",
          aprovado: false,
          createdAt: { lte: new Date("2026-04-07T12:00:00.000Z") },
        },
      ],
    });
  });

  it("atualiza o status de aprovacao corretamente", async () => {
    await atualizarStatusSolicitacao(4, true);

    expect(prismaMock.solicitacaoColeta.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        aprovado: true,
        status: "aprovada",
      },
    });
  });

  it("lista apenas solicitacoes aprovadas e sem coleta para empresas", async () => {
    await listarSolicitacoesAprovadas();

    expect(prismaMock.solicitacaoColeta.findMany).toHaveBeenCalledWith({
      where: { aprovado: true, status: "aprovada", coleta: null },
      include: {
        user: { select: { id: true, nome: true, email: true, endereco: true } },
        material: true,
        imagens: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });
});
