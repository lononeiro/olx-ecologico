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

export function hasAddressDetails(address: Partial<AddressFields>) {
  return Object.values(address).some((value) => String(value ?? "").trim() !== "");
}

export function getMissingAddressFields(address: Partial<AddressFields>) {
  const missing: string[] = [];

  if (!normalizeCep(address.cep ?? "")) missing.push("CEP");
  if (!address.rua?.trim()) missing.push("rua");
  if (!address.numero?.trim()) missing.push("numero");
  if (!address.bairro?.trim()) missing.push("bairro");
  if (!address.cidade?.trim()) missing.push("cidade");
  if (!address.uf?.trim()) missing.push("UF");

  return missing;
}
