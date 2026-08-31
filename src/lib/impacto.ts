/**
 * Estimativa de impacto ambiental a partir de material + quantidade.
 *
 * Os fatores são estimativas médias baseadas em literatura de reciclagem
 * (CO₂ evitado, água e energia poupadas por kg reciclado em relação ao
 * descarte/produção com matéria virgem). Servem para comunicar ordem de
 * grandeza do impacto, não para contabilidade oficial de carbono.
 */

export type CategoriaMaterial =
  | "metal"
  | "plastico"
  | "papel"
  | "vidro"
  | "organico"
  | "eletronico"
  | "oleo"
  | "textil"
  | "madeira"
  | "borracha"
  | "outro";

interface FatorMaterial {
  /** kg de CO₂e evitado por kg reciclado */
  co2: number;
  /** litros de água poupada por kg reciclado */
  agua: number;
  /** kWh de energia poupada por kg reciclado */
  energia: number;
  /** árvores preservadas por kg (relevante para papel/madeira) */
  arvores: number;
}

const FATORES: Record<CategoriaMaterial, FatorMaterial> = {
  metal: { co2: 8.0, agua: 15, energia: 9.0, arvores: 0 },
  plastico: { co2: 1.8, agua: 20, energia: 5.8, arvores: 0 },
  papel: { co2: 1.1, agua: 26, energia: 4.0, arvores: 0.017 },
  vidro: { co2: 0.3, agua: 2, energia: 0.6, arvores: 0 },
  organico: { co2: 0.5, agua: 0, energia: 0.2, arvores: 0 },
  eletronico: { co2: 1.4, agua: 10, energia: 6.0, arvores: 0 },
  oleo: { co2: 3.0, agua: 25, energia: 2.0, arvores: 0 },
  textil: { co2: 3.6, agua: 100, energia: 2.0, arvores: 0 },
  madeira: { co2: 0.9, agua: 5, energia: 1.0, arvores: 0.008 },
  borracha: { co2: 2.5, agua: 8, energia: 3.0, arvores: 0 },
  outro: { co2: 1.0, agua: 10, energia: 2.0, arvores: 0 },
};

/** Peso médio assumido (kg) para unidades que não são de massa. */
const PESO_POR_UNIDADE = {
  saco: 5,
  caixa: 8,
  litro: 1,
  unidade: 1,
};

/**
 * Classifica o material numa categoria com base em palavras-chave do nome.
 * Espelha a lógica de badge/cor usada nas telas.
 */
export function categoriaMaterial(nome: string): CategoriaMaterial {
  const value = nome.toLowerCase();
  if (value.includes("metal") || value.includes("alumin") || value.includes("lata")) return "metal";
  if (value.includes("plast") || value.includes("pet")) return "plastico";
  if (value.includes("papel") || value.includes("papelao") || value.includes("papelão") || value.includes("cartao")) return "papel";
  if (value.includes("vidro")) return "vidro";
  if (value.includes("organ") || value.includes("compost")) return "organico";
  if (value.includes("eletr") || value.includes("e-lixo") || value.includes("eletron")) return "eletronico";
  if (value.includes("oleo") || value.includes("óleo")) return "oleo";
  if (value.includes("text") || value.includes("roupa") || value.includes("tecido")) return "textil";
  if (value.includes("madeira")) return "madeira";
  if (value.includes("borracha") || value.includes("pneu")) return "borracha";
  return "outro";
}

/**
 * Estima o peso em kg a partir de um texto livre de quantidade
 * (ex.: "50 kg", "10 sacos", "3 caixas", "1,5 t", "500 g").
 * Retorna 0 quando não há número reconhecível.
 */
export function estimarKg(quantidade: string): number {
  if (!quantidade) return 0;
  const texto = quantidade.toLowerCase().trim();
  const match = texto.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return 0;
  const valor = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return 0;

  // toneladas
  if (/\bt\b|tonelad/.test(texto)) return valor * 1000;
  // gramas (mas não "kg")
  if (/\bg\b|grama/.test(texto) && !/kg|quilo/.test(texto)) return valor / 1000;
  // quilos
  if (/kg|quilo/.test(texto)) return valor;
  // sacos
  if (/saco/.test(texto)) return valor * PESO_POR_UNIDADE.saco;
  // caixas
  if (/caixa/.test(texto)) return valor * PESO_POR_UNIDADE.caixa;
  // litros
  if (/litro|\bl\b|\blt\b/.test(texto)) return valor * PESO_POR_UNIDADE.litro;
  // unidades/peças/itens
  if (/unidade|\bun\b|peca|peça|item|itens/.test(texto)) return valor * PESO_POR_UNIDADE.unidade;
  // apenas número: assume kg
  return valor;
}

export interface ImpactoItem {
  materialNome: string;
  quantidade: string;
  /** Peso em kg informado pelo usuário (fonte confiável). Se ausente, usa o parser. */
  pesoEstimadoKg?: number | null;
}

export interface ImpactoResumo {
  /** kg totais reciclados */
  kg: number;
  /** kg de CO₂e evitados */
  co2: number;
  /** litros de água poupada */
  agua: number;
  /** kWh de energia poupada */
  energia: number;
  /** árvores preservadas (equivalente) */
  arvores: number;
  /** número de coletas consideradas */
  coletas: number;
  /** coletas cujo peso foi informado pelo usuário (cálculo direto) */
  informados: number;
  /** coletas cujo peso foi estimado pelo parser de texto */
  estimados: number;
}

const RESUMO_VAZIO: ImpactoResumo = {
  kg: 0, co2: 0, agua: 0, energia: 0, arvores: 0, coletas: 0, informados: 0, estimados: 0,
};

/**
 * Resolve o peso em kg de uma coleta, preferindo o valor informado pelo
 * usuário e caindo no parser heurístico de `quantidade` quando ele não existe.
 */
export function resolverPesoKg(item: ImpactoItem): { kg: number; fonte: "informado" | "estimado" } {
  if (typeof item.pesoEstimadoKg === "number" && item.pesoEstimadoKg > 0) {
    return { kg: item.pesoEstimadoKg, fonte: "informado" };
  }
  return { kg: estimarKg(item.quantidade), fonte: "estimado" };
}

/**
 * Soma o impacto ambiental de uma lista de coletas (tipicamente as concluídas).
 * Para cada coleta usa o peso informado quando disponível; senão, estima do texto.
 */
export function calcularImpacto(items: ImpactoItem[]): ImpactoResumo {
  return items.reduce<ImpactoResumo>((acc, item) => {
    const { kg, fonte } = resolverPesoKg(item);
    const contadores = {
      coletas: acc.coletas + 1,
      informados: acc.informados + (fonte === "informado" ? 1 : 0),
      estimados: acc.estimados + (fonte === "informado" ? 0 : 1),
    };
    if (kg <= 0) return { ...acc, ...contadores };
    const fator = FATORES[categoriaMaterial(item.materialNome)];
    return {
      kg: acc.kg + kg,
      co2: acc.co2 + kg * fator.co2,
      agua: acc.agua + kg * fator.agua,
      energia: acc.energia + kg * fator.energia,
      arvores: acc.arvores + kg * fator.arvores,
      ...contadores,
    };
  }, { ...RESUMO_VAZIO });
}

/** Formata um número grande de forma compacta e legível em pt-BR. */
export function formatarNumeroImpacto(valor: number): string {
  const arredondado = Math.round(valor);
  if (arredondado >= 1000) {
    return (arredondado / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
  }
  return arredondado.toLocaleString("pt-BR");
}

/** Formata peso: usa toneladas acima de 1000 kg. */
export function formatarPeso(kg: number): { valor: string; unidade: string } {
  if (kg >= 1000) {
    return { valor: (kg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }), unidade: "t" };
  }
  return { valor: Math.round(kg).toLocaleString("pt-BR"), unidade: "kg" };
}
