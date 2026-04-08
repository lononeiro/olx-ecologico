import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  coleta: {
    findUnique: vi.fn(),
  },
  mensagem: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  enviarMensagem,
  listarMensagensColeta,
  verificarAcessoColeta,
} from "@/services/mensagem.service";

describe("mensagem.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verificarAcessoColeta", () => {
    it("retorna null quando a coleta nao existe", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(verificarAcessoColeta(1, 5)).resolves.toBeNull();
    });

    it("retorna a coleta quando o usuario e dono da solicitacao", async () => {
      const coleta = {
        id: 1,
        solicitacao: { userId: 5 },
        company: { userId: 10 },
      };
      prismaMock.coleta.findUnique.mockResolvedValueOnce(coleta);

      await expect(verificarAcessoColeta(1, 5)).resolves.toEqual(coleta);
    });

    it("retorna null quando o usuario nao tem acesso", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 1,
        solicitacao: { userId: 3 },
        company: { userId: 4 },
      });

      await expect(verificarAcessoColeta(1, 7)).resolves.toBeNull();
    });
  });

  describe("listarMensagensColeta", () => {
    it("bloqueia acesso a conversa quando o usuario nao pertence a coleta", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(listarMensagensColeta(9, 7)).rejects.toThrow(
        /Acesso negado/
      );
    });

    it("lista mensagens em ordem crescente quando autorizado", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 9,
        solicitacao: { userId: 7 },
        company: { userId: 11 },
      });

      await listarMensagensColeta(9, 7);

      expect(prismaMock.mensagem.findMany).toHaveBeenCalledWith({
        where: { coletaId: 9 },
        include: { remetente: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("enviarMensagem", () => {
    it("impede envio quando o remetente nao tem permissao", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(enviarMensagem(4, 2, "Oi")).rejects.toThrow(
        /permiss/
      );
    });

    it("cria mensagem com o remetente quando autorizado", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 4,
        solicitacao: { userId: 2 },
        company: { userId: 8 },
      });
      prismaMock.mensagem.create.mockResolvedValueOnce({ id: 99 });

      await enviarMensagem(4, 2, "Mensagem de teste");

      expect(prismaMock.mensagem.create).toHaveBeenCalledWith({
        data: { coletaId: 4, remetenteId: 2, mensagem: "Mensagem de teste" },
        include: { remetente: { select: { id: true, nome: true } } },
      });
    });
  });
});
