import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, randomBytesMock } = vi.hoisted(() => {
  const prismaMock = {
    solicitacaoColeta: {
      findFirst: vi.fn(),
    },
    coleta: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    avaliacao: {
      deleteMany: vi.fn(),
    },
    mensagem: {
      deleteMany: vi.fn(),
    },
    conversaSolicitacao: {
      updateMany: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
    },
    notificacao: {
      create: vi.fn(),
    },
    pushToken: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prismaMock)),
  };

  return {
    prismaMock,
    randomBytesMock: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("crypto", () => ({
  default: {
    randomBytes: randomBytesMock,
  },
}));

import {
  aceitarSolicitacao,
  atualizarStatusColeta,
  buscarColetaPorId,
  listarColetasDaEmpresa,
} from "@/services/coleta.service";

describe("coleta.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.solicitacaoColeta.findFirst.mockResolvedValue({ id: 10 });
    prismaMock.company.findUnique.mockResolvedValue({ user: { nome: "EcoColeta" } });
    // Sem devices registrados: o envio de push (best-effort) sai cedo e sem ruído.
    prismaMock.pushToken.findMany.mockResolvedValue([]);
    randomBytesMock.mockReturnValue({
      toString: vi.fn().mockReturnValue("ab12cd34"),
    });
  });

  describe("aceitarSolicitacao", () => {
    it("impede aceitar solicitação indisponível", async () => {
      prismaMock.solicitacaoColeta.findFirst.mockResolvedValueOnce(null);

      await expect(aceitarSolicitacao(10, 5)).rejects.toThrow(
        "Solicitação indisponível para aceite."
      );

    expect(prismaMock.coleta.create).not.toHaveBeenCalled();
      expect(prismaMock.conversaSolicitacao.updateMany).not.toHaveBeenCalled();
    });

    it("impede aceitar uma solicitação já vinculada a outra coleta", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({ id: 3 });

      await expect(aceitarSolicitacao(10, 5)).rejects.toThrow(
        "Solicitação já foi aceita por outra empresa."
      );

      expect(prismaMock.coleta.create).not.toHaveBeenCalled();
      expect(prismaMock.conversaSolicitacao.updateMany).not.toHaveBeenCalled();
    });

    it("cria a coleta com código de confirmação em maiúsculo", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);
      prismaMock.coleta.create.mockResolvedValueOnce({
        id: 9,
        companyId: 5,
        solicitacaoId: 10,
        solicitacao: { userId: 3, titulo: "Coleta de papel" },
      });

      await aceitarSolicitacao(10, 5);

      expect(prismaMock.coleta.create).toHaveBeenCalledWith({
        data: {
          solicitacaoId: 10,
          companyId: 5,
          status: "aceita",
          codigoConfirmacao: "AB12CD34",
        },
        include: { solicitacao: true, company: true },
      });
      expect(prismaMock.conversaSolicitacao.updateMany).toHaveBeenCalledWith({
        where: { solicitacaoId: 10, companyId: 5 },
        data: { status: "convertida" },
      });
      expect(prismaMock.conversaSolicitacao.updateMany).toHaveBeenCalledWith({
        where: { solicitacaoId: 10, companyId: { not: 5 } },
        data: { status: "encerrada" },
      });
    });

    it("cria a coleta com data de previsão quando informada", async () => {
      const dataPrevisaoColeta = new Date("2026-04-27T17:30:00.000Z");
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);
      prismaMock.coleta.create.mockResolvedValueOnce({
        id: 9,
        companyId: 5,
        solicitacaoId: 10,
        solicitacao: { userId: 3, titulo: "Coleta de papel" },
      });

      await aceitarSolicitacao(10, 5, dataPrevisaoColeta);

      expect(prismaMock.coleta.create).toHaveBeenCalledWith({
        data: {
          solicitacaoId: 10,
          companyId: 5,
          status: "aceita",
          codigoConfirmacao: "AB12CD34",
          dataPrevisaoColeta,
        },
        include: { solicitacao: true, company: true },
      });
    });
  });

  describe("atualizarStatusColeta", () => {
    it("rejeita quando a coleta não pertence à empresa", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce(null);

      await expect(atualizarStatusColeta(1, 2, "a_caminho")).rejects.toThrow(
        "Coleta não encontrada ou sem permissão."
      );
    });

    it("define dataConclusao ao concluir a coleta", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce({
        id: 1,
        companyId: 2,
        solicitacao: { id: 7, userId: 3, titulo: "Coleta de papel" },
      });

      await atualizarStatusColeta(1, 2, "concluida");

      expect(prismaMock.coleta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "concluida",
          dataConclusao: expect.any(Date),
        }),
      });
    });

    it("não define dataConclusao para status intermediário", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce({
        id: 1,
        companyId: 2,
        solicitacao: { id: 7, userId: 3, titulo: "Coleta de papel" },
      });

      await atualizarStatusColeta(1, 2, "a_caminho");

      expect(prismaMock.coleta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "a_caminho" },
      });
    });

    it("ao cancelar, apaga a coleta, reabre as conversas e devolve a solicitação à pool", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce({
        id: 1,
        companyId: 2,
        solicitacao: { id: 7, userId: 3, titulo: "Coleta de papel" },
      });

      const resultado = await atualizarStatusColeta(1, 2, "cancelada");

      // Remove a coleta e o que depende dela.
      expect(prismaMock.avaliacao.deleteMany).toHaveBeenCalledWith({
        where: { coletaId: 1 },
      });
      expect(prismaMock.mensagem.deleteMany).toHaveBeenCalledWith({
        where: { coletaId: 1 },
      });
      expect(prismaMock.coleta.delete).toHaveBeenCalledWith({ where: { id: 1 } });

      // Reabre as conversas pré-aceite: a solicitação (coleta: null) volta à pool.
      expect(prismaMock.conversaSolicitacao.updateMany).toHaveBeenCalledWith({
        where: { solicitacaoId: 7 },
        data: { status: "aberta" },
      });

      // Não usa o caminho de update (não persiste "cancelada" na coleta).
      expect(prismaMock.coleta.update).not.toHaveBeenCalled();

      // A resposta reflete o cancelamento.
      expect(resultado).toMatchObject({ status: "cancelada" });
    });
  });

  it("lista coletas da empresa com relacionamento necessário", async () => {
    prismaMock.coleta.findMany.mockResolvedValueOnce([]);

    await listarColetasDaEmpresa(22);

    expect(prismaMock.coleta.findMany).toHaveBeenCalledWith({
      where: { companyId: 22 },
      include: {
        solicitacao: {
          include: {
            user: { select: { id: true, nome: true, email: true, telefone: true } },
            material: true,
            imagens: true,
          },
        },
      },
      orderBy: { dataAceite: "desc" },
    });
  });

  describe("buscarColetaPorId", () => {
    it("retorna null quando a coleta não existe", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(buscarColetaPorId(30)).resolves.toBeNull();
      expect(JSON.stringify(prismaMock.coleta.findUnique.mock.calls.at(-1)?.[0])).not.toContain("mensagens");
      expect(JSON.stringify(prismaMock.coleta.findUnique.mock.calls.at(-1)?.[0])).not.toContain("endereco");
    });

    it("retorna null se o usuário não for dono da solicitação", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 30,
        solicitacao: { userId: 99 },
        companyId: 5,
      });

      await expect(buscarColetaPorId(30, 10)).resolves.toBeNull();
    });

    it("retorna null se a empresa não for responsável pela coleta", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 30,
        solicitacao: { userId: 10 },
        companyId: 99,
      });

      await expect(buscarColetaPorId(30, undefined, 5)).resolves.toBeNull();
    });

    it("retorna a coleta quando a permissão confere", async () => {
      const coleta = {
        id: 30,
        solicitacao: { userId: 10 },
        companyId: 5,
      };
      prismaMock.coleta.findUnique.mockResolvedValueOnce(coleta);

      await expect(buscarColetaPorId(30, 10)).resolves.toEqual(coleta);
    });

    it("inclui mensagens ordenadas quando solicitado", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 30,
        solicitacao: { userId: 10 },
        companyId: 5,
      });

      await buscarColetaPorId(30, 10, undefined, { includeMensagens: true });

      expect(prismaMock.coleta.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            mensagens: {
              include: { remetente: { select: { id: true, nome: true, avatarUrl: true } } },
              orderBy: { createdAt: "asc" },
            },
          }),
        })
      );
    });
  });
});
