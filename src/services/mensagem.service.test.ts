import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    coleta: {
      findUnique: vi.fn(),
    },
    mensagem: {
      findMany: vi.fn(),
      create: vi.fn(),
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
  enviarMensagem,
  listarMensagensColeta,
  verificarAcessoColeta,
} from "@/services/mensagem.service";

describe("mensagem.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verificarAcessoColeta", () => {
    it("retorna null quando a coleta não existe", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(verificarAcessoColeta(1, 5)).resolves.toBeNull();
    });

    it("retorna a coleta quando o usuário é dono da solicitação", async () => {
      const coleta = {
        id: 1,
        solicitacao: { userId: 5 },
        company: { userId: 10 },
      };
      prismaMock.coleta.findUnique.mockResolvedValueOnce(coleta);

      await expect(verificarAcessoColeta(1, 5)).resolves.toEqual(coleta);
    });

    it("retorna null quando o usuário não tem acesso", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 1,
        solicitacao: { userId: 3 },
        company: { userId: 4 },
      });

      await expect(verificarAcessoColeta(1, 7)).resolves.toBeNull();
    });

    it("retorna a coleta quando o usuário é a empresa responsável", async () => {
      const coleta = {
        id: 1,
        solicitacao: { userId: 5 },
        company: { userId: 10 },
      };
      prismaMock.coleta.findUnique.mockResolvedValueOnce(coleta);

      await expect(verificarAcessoColeta(1, 10)).resolves.toEqual(coleta);
    });
  });

  describe("listarMensagensColeta", () => {
    it("bloqueia acesso à conversa quando o usuário não pertence à coleta", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(listarMensagensColeta(9, 7)).rejects.toThrow(
        /Acesso negado/
      );
    });

    it("bloqueia admin quando não for dono nem empresa responsável", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 9,
        solicitacao: { userId: 7 },
        company: { userId: 11 },
      });

      await expect(listarMensagensColeta(9, 99)).rejects.toThrow(
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

    it("lista apenas mensagens novas quando sinceId é informado", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 9,
        solicitacao: { userId: 7 },
        company: { userId: 11 },
      });

      await listarMensagensColeta(9, 7, { sinceId: 44 });

      expect(prismaMock.mensagem.findMany).toHaveBeenCalledWith({
        where: { coletaId: 9, id: { gt: 44 } },
        include: { remetente: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("enviarMensagem", () => {
    it("impede envio quando o remetente não tem permissão", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce(null);

      await expect(enviarMensagem(4, 2, "Oi")).rejects.toThrow(
        /permiss/
      );
    });

    it("cria mensagem com o remetente quando autorizado", async () => {
      prismaMock.coleta.findUnique.mockResolvedValueOnce({
        id: 4,
        solicitacao: { userId: 2, titulo: "Coleta de papel" },
        company: { userId: 8 },
      });
      prismaMock.mensagem.create.mockResolvedValueOnce({
        id: 99,
        remetente: { id: 2, nome: "Fulano" },
      });

      await enviarMensagem(4, 2, "Mensagem de teste");

      expect(prismaMock.mensagem.create).toHaveBeenCalledWith({
        data: { coletaId: 4, remetenteId: 2, mensagem: "Mensagem de teste" },
        include: { remetente: { select: { id: true, nome: true } } },
      });
      expect(prismaMock.notificacao.create).toHaveBeenCalledTimes(1);
    });
  });
});
