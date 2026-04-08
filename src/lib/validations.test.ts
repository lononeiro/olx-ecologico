import { describe, expect, it } from "vitest";
import {
  coletaStatusSchema,
  mensagemCreateSchema,
  profileUpdateSchema,
  registerSchema,
  solicitacaoCreateSchema,
} from "@/lib/validations";

describe("validations", () => {
  describe("registerSchema", () => {
    it("aceita um cadastro de usuario valido", () => {
      const result = registerSchema.safeParse({
        nome: "Maria Silva",
        email: "maria@example.com",
        senha: "Senha@123",
        tipo: "usuario",
      });

      expect(result.success).toBe(true);
    });

    it("rejeita email invalido", () => {
      const result = registerSchema.safeParse({
        nome: "Maria Silva",
        email: "maria",
        senha: "Senha@123",
        tipo: "usuario",
      });

      expect(result.success).toBe(false);
    });

    it("rejeita senha fraca", () => {
      const result = registerSchema.safeParse({
        nome: "Maria Silva",
        email: "maria@example.com",
        senha: "12345678",
        tipo: "usuario",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("solicitacaoCreateSchema", () => {
    it("normaliza imagens nulas para array vazio", () => {
      const result = solicitacaoCreateSchema.parse({
        titulo: "Coleta de papel",
        descricao: "Descricao detalhada do material para coleta.",
        quantidade: "2 caixas",
        endereco: "Rua das Flores, 10",
        materialId: "2",
        imagens: null,
      });

      expect(result.imagens).toEqual([]);
      expect(result.materialId).toBe(2);
    });

    it("remove strings vazias e faz trim das imagens", () => {
      const result = solicitacaoCreateSchema.parse({
        titulo: "Coleta de metal",
        descricao: "Descricao detalhada do material para coleta.",
        quantidade: "15 kg",
        endereco: "Rua A, 100",
        materialId: 3,
        imagens: [" https://img.com/a.jpg ", "", "https://img.com/b.jpg"],
      });

      expect(result.imagens).toEqual([
        "https://img.com/a.jpg",
        "https://img.com/b.jpg",
      ]);
    });

    it("rejeita quando excede o limite de 5 imagens", () => {
      const result = solicitacaoCreateSchema.safeParse({
        titulo: "Coleta de plastico",
        descricao: "Descricao detalhada do material para coleta.",
        quantidade: "5 sacos",
        endereco: "Rua B, 20",
        materialId: 1,
        imagens: [
          "https://img.com/1.jpg",
          "https://img.com/2.jpg",
          "https://img.com/3.jpg",
          "https://img.com/4.jpg",
          "https://img.com/5.jpg",
          "https://img.com/6.jpg",
        ],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("profileUpdateSchema", () => {
    it("converte telefone e endereco vazios para null e aplica trim", () => {
      const result = profileUpdateSchema.parse({
        nome: "  Joao Silva  ",
        telefone: "   ",
        endereco: "  Rua Central, 123  ",
      });

      expect(result).toEqual({
        nome: "Joao Silva",
        telefone: null,
        endereco: "Rua Central, 123",
      });
    });

    it("rejeita nome muito curto", () => {
      const result = profileUpdateSchema.safeParse({
        nome: "A",
        telefone: null,
        endereco: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("coletaStatusSchema", () => {
    it("aceita apenas status previstos", () => {
      expect(
        coletaStatusSchema.safeParse({ status: "a_caminho" }).success
      ).toBe(true);
      expect(
        coletaStatusSchema.safeParse({ status: "invalido" }).success
      ).toBe(false);
    });
  });

  describe("mensagemCreateSchema", () => {
    it("rejeita mensagem vazia", () => {
      const result = mensagemCreateSchema.safeParse({
        coletaId: 1,
        mensagem: "",
      });

      expect(result.success).toBe(false);
    });
  });
});
