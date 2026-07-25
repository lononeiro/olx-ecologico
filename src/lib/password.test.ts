import { describe, expect, it } from "vitest";
import {
  getStrongPasswordIssues,
  isStrongPassword,
} from "@/lib/password";

describe("password", () => {
  describe("isStrongPassword", () => {
    it("aceita uma senha que cumpre todas as regras", () => {
      expect(isStrongPassword("Senha@123")).toBe(true);
    });

    it("rejeita senha sem caractere especial", () => {
      expect(isStrongPassword("Senha1234")).toBe(false);
    });

    it("rejeita senha curta", () => {
      expect(isStrongPassword("Ab@1")).toBe(false);
    });
  });

  describe("getStrongPasswordIssues", () => {
    it("não retorna problemas para senha forte", () => {
      expect(getStrongPasswordIssues("Senha@123")).toEqual([]);
    });

    it("acumula todos os problemas de uma senha fraca", () => {
      const issues = getStrongPasswordIssues("abc");

      expect(issues).toContain("A senha deve ter pelo menos 8 caracteres.");
      expect(issues).toContain(
        "A senha deve incluir ao menos uma letra maiúscula."
      );
      expect(issues).toContain("A senha deve incluir ao menos um número.");
      expect(issues).toContain(
        "A senha deve incluir ao menos um caractere especial."
      );
    });

    it("aponta apenas o caractere especial faltante", () => {
      expect(getStrongPasswordIssues("Senha1234")).toEqual([
        "A senha deve incluir ao menos um caractere especial.",
      ]);
    });
  });
});
