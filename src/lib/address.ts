export interface AddressFields {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface CepLookupResult {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string;
}

export const EMPTY_ADDRESS_FIELDS: AddressFields = {
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export function normalizeCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value: string) {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function buildAddressString(address: Partial<AddressFields>) {
  const ruaNumero =
    address.rua && address.numero
      ? `${address.rua}, ${address.numero}`
      : address.rua || address.numero || "";

  const cidadeUf =
    address.cidade && address.uf
      ? `${address.cidade} - ${address.uf}`
      : address.cidade || address.uf || "";

  return [
    ruaNumero,
    address.complemento?.trim(),
    address.bairro?.trim(),
    cidadeUf,
    address.cep ? `CEP ${formatCep(address.cep)}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

// Best-effort: reverte uma string gerada por buildAddressString de volta para campos.
// Formato esperado: "Rua, Numero, Complemento?, Bairro?, Cidade - UF, CEP 00000-000".
export function parseAddressString(value: string | null | undefined): AddressFields {
  const result: AddressFields = { ...EMPTY_ADDRESS_FIELDS };
  if (!value || !value.trim()) return result;

  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);

  // CEP — segmento com a palavra "CEP" ou que seja apenas o número.
  const cepIdx = parts.findIndex((p) => /cep/i.test(p) || /^\d{5}-?\d{3}$/.test(p));
  if (cepIdx !== -1) {
    const match = parts[cepIdx].match(/\d{5}-?\d{3}/);
    if (match) result.cep = normalizeCep(match[0]);
    parts.splice(cepIdx, 1);
  }

  // UF isolada (ex.: formato antigo "..., SP").
  const ufIdx = parts.findIndex((p) => /^[A-Za-z]{2}$/.test(p));
  if (ufIdx !== -1) {
    result.uf = parts[ufIdx].toUpperCase();
    parts.splice(ufIdx, 1);
  }

  // Cidade - UF juntos (formato do builder, ex.: "São Paulo - SP").
  const cidadeUfIdx = parts.findIndex((p) => /\s-\s*[A-Za-zÀ-ÿ]{2}$/.test(p));
  if (cidadeUfIdx !== -1) {
    const match = parts[cidadeUfIdx].match(/^(.*?)\s-\s*([A-Za-zÀ-ÿ]{2})$/);
    if (match) {
      result.cidade = match[1].trim();
      result.uf = match[2].toUpperCase();
    }
    parts.splice(cidadeUfIdx, 1);
  }

  // Número - Cidade juntos (formato antigo, ex.: "123 - São Paulo").
  if (!result.cidade) {
    const numCidadeIdx = parts.findIndex((p) => /^\d+\s*[A-Za-z]?\s-\s*.+/.test(p));
    if (numCidadeIdx !== -1) {
      const match = parts[numCidadeIdx].match(/^(\d+\s*[A-Za-z]?)\s-\s*(.+)$/);
      if (match) {
        result.numero = match[1].trim();
        result.cidade = match[2].trim();
      }
      parts.splice(numCidadeIdx, 1);
    }
  }

  if (parts.length) result.rua = parts.shift() ?? "";
  // Número — próximo token curto contendo dígitos (se ainda não definido).
  if (!result.numero && parts.length && /\d/.test(parts[0]) && parts[0].length <= 12) {
    result.numero = parts.shift() ?? "";
  }
  // Restantes — complemento e/ou bairro (melhor esforço).
  if (parts.length === 1) {
    result.bairro = parts[0];
  } else if (parts.length >= 2) {
    result.complemento = parts[0];
    result.bairro = parts.slice(1).join(", ");
  }

  return result;
}

export function hasAddressDetails(address: Partial<AddressFields>) {
  return Object.values(address).some((value) => String(value ?? "").trim() !== "");
}

export function getMissingAddressFields(address: Partial<AddressFields>) {
  const missing: string[] = [];

  if (!normalizeCep(address.cep ?? "")) missing.push("CEP");
  if (!address.rua?.trim()) missing.push("rua");
  if (!address.numero?.trim()) missing.push("número");
  if (!address.bairro?.trim()) missing.push("bairro");
  if (!address.cidade?.trim()) missing.push("cidade");
  if (!address.uf?.trim()) missing.push("UF");

  return missing;
}
