import { describe, expect, it } from "vitest";
import { calcularImpacto, categoriaMaterial, estimarKg } from "@/lib/impacto";

describe("impacto", () => {
  describe("categoriaMaterial", () => {
    it("classifica materiais por palavra-chave", () => {
      expect(categoriaMaterial("Papelão")).toBe("papel");
      expect(categoriaMaterial("Plástico PET")).toBe("plastico");
      expect(categoriaMaterial("Latas de alumínio")).toBe("metal");
      expect(categoriaMaterial("Vidro")).toBe("vidro");
      expect(categoriaMaterial("Óleo de cozinha")).toBe("oleo");
      expect(categoriaMaterial("Eletrônicos")).toBe("eletronico");
    });

    it("cai em 'outro' para material desconhecido", () => {
      expect(categoriaMaterial("Material misterioso")).toBe("outro");
    });
  });

  describe("estimarKg", () => {
    it("lê quilos diretamente", () => {
      expect(estimarKg("50 kg")).toBe(50);
      expect(estimarKg("50kg")).toBe(50);
    });

    it("converte toneladas e gramas", () => {
      expect(estimarKg("1,5 t")).toBe(1500);
      expect(estimarKg("500 g")).toBe(0.5);
    });

    it("estima peso de sacos e caixas", () => {
      expect(estimarKg("10 sacos")).toBe(50);
      expect(estimarKg("3 caixas")).toBe(24);
    });

    it("assume kg quando só há número", () => {
      expect(estimarKg("20")).toBe(20);
    });

    it("retorna 0 sem número", () => {
      expect(estimarKg("bastante")).toBe(0);
      expect(estimarKg("")).toBe(0);
    });
  });

  describe("calcularImpacto", () => {
    it("soma o impacto de várias coletas", () => {
      const resumo = calcularImpacto([
        { materialNome: "Metal", quantidade: "10 kg" },
        { materialNome: "Papel", quantidade: "10 kg" },
      ]);
      expect(resumo.kg).toBe(20);
      expect(resumo.coletas).toBe(2);
      // metal (8.0) + papel (1.1) por 10 kg cada = 91 kg CO2
      expect(resumo.co2).toBeCloseTo(91, 5);
      expect(resumo.arvores).toBeCloseTo(0.17, 5);
    });

    it("conta a coleta mesmo quando não consegue estimar o peso", () => {
      const resumo = calcularImpacto([{ materialNome: "Vidro", quantidade: "alguns potes" }]);
      expect(resumo.kg).toBe(0);
      expect(resumo.coletas).toBe(1);
      expect(resumo.estimados).toBe(1);
      expect(resumo.informados).toBe(0);
    });

    it("prefere o peso informado ao texto livre", () => {
      const resumo = calcularImpacto([
        // texto diria 5 kg, mas o peso informado (40) tem prioridade
        { materialNome: "Metal", quantidade: "5 kg", pesoEstimadoKg: 40 },
      ]);
      expect(resumo.kg).toBe(40);
      expect(resumo.co2).toBeCloseTo(40 * 8.0, 5);
      expect(resumo.informados).toBe(1);
      expect(resumo.estimados).toBe(0);
    });

    it("ignora peso informado inválido e cai no parser", () => {
      const resumo = calcularImpacto([
        { materialNome: "Papel", quantidade: "10 kg", pesoEstimadoKg: 0 },
      ]);
      expect(resumo.kg).toBe(10);
      expect(resumo.estimados).toBe(1);
    });

    it("separa a contagem de informados e estimados", () => {
      const resumo = calcularImpacto([
        { materialNome: "Metal", quantidade: "x", pesoEstimadoKg: 10 },
        { materialNome: "Papel", quantidade: "5 kg" },
      ]);
      expect(resumo.coletas).toBe(2);
      expect(resumo.informados).toBe(1);
      expect(resumo.estimados).toBe(1);
    });
  });
});
