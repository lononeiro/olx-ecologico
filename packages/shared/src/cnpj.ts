/** Remove máscara e mantém apenas os 14 dígitos do CNPJ. */
export function sanitizeCNPJ(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Aplica a máscara 00.000.000/0001-00 sobre um CNPJ (com ou sem máscara). */
export function formatCNPJ(value: string): string {
  const cnpj = sanitizeCNPJ(value).slice(0, 14);
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/**
 * Valida um CNPJ pelo algoritmo dos dígitos verificadores (offline).
 * Não garante que a empresa exista na Receita — apenas que o número é
 * matematicamente válido. Rejeita tamanho incorreto e sequências repetidas.
 */
export function isValidCNPJ(value: string | null | undefined): boolean {
  const cnpj = sanitizeCNPJ(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (base: string): number => {
    const tamanho = base.length;
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(base[i]) * peso;
      peso = peso - 1 < 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const base12 = cnpj.slice(0, 12);
  const dv1 = calcularDigito(base12);
  const dv2 = calcularDigito(base12 + dv1);
  return cnpj.slice(12) === `${dv1}${dv2}`;
}
