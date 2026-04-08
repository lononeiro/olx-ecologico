import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  coleta: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
};

const randomBytesMock = vi.fn();

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
    randomBytesMock.mockReturnValue({
      toString: vi.fn().mockReturnValue("ab12cd34"),
    });
  });

  describe("aceitarSolicitacao", () => {
    it("impede aceitar uma solicitacao ja vinculada a outra coleta", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({ id: 3 });

      await expect(aceitarSolicitacao(10, 5)).rejects.toThrow(
        "Solicitação já foi aceita por outra empresa."
      );

      expect(prismaMock.coleta.create).not.toHaveBeenCalled();
    });

    it("cria a coleta com codigo de confirmacao em maiusculo", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);
      prismaMock.coleta.create.mockResolvedValueOnce({ id: 9 });

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
    });
  });

  describe("atualizarStatusColeta", () => {
    it("rejeita quando a coleta nao pertence a empresa", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce(null);

      await expect(atualizarStatusColeta(1, 2, "a_caminho")).rejects.toThrow(
        "Coleta não encontrada ou sem permissão."
      );
    });

    it("define dataConclusao ao concluir a coleta", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce({ id: 1, companyId: 2 });

      await atualizarStatusColeta(1, 2, "concluida");

      expect(prismaMock.coleta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: "concluida",
          dataConclusao: expect.any(Date),
        }),
      });
    });

    it("nao define dataConclusao para status intermediario", async () => {
      prismaMock.coleta.findFirst.mockResolvedValueOnce({ id: 1, companyId: 2 });

      await atualizarStatusColeta(1, 2, "a_caminho");

      expect(prismaMock.coleta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "a_caminho" },
      });
    });
  });

  it("lista coletas da empresa com relacionamento necessario", async () => {
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
    it("retorna null quando a coleta nao existe", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(buscarColetaPorId(30)).resolves.toBeNull();
    });

    it("retorna null se o usuario nao for dono da solicitacao", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 30,
        solicitacao: { userId: 99 },
        companyId: 5,
      });

      await expect(buscarColetaPorId(30, 10)).resolves.toBeNull();
    });

    it("retorna null se a empresa nao for responsavel pela coleta", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 30,
        solicitacao: { userId: 10 },
        companyId: 99,
      });

      await expect(buscarColetaPorId(30, undefined, 5)).resolves.toBeNull();
    });

    it("retorna a coleta quando a permissao confere", async () => {
      const coleta = {
        id: 30,
        solicitacao: { userId: 10 },
        companyId: 5,
      };
      prismaMock.coleta.findUnique.mockResolvedValueOnce(coleta);

      await expect(buscarColetaPorId(30, 10)).resolves.toEqual(coleta);
    });
  });
});
