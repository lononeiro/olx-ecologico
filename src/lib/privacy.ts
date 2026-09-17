type AddressLike = string | null | undefined;

export function maskEmail(email: string | null | undefined) {
  if (!email) return null;

  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";

  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined) {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";

  return `${"*".repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

/**
 * Primeiro nome de um nome completo. Usado quando a empresa precisa saber
 * "quem" pediu a coleta sem expor o nome completo (que só é liberado, junto
 * do endereço exato e contato, depois que ela aceita a solicitação).
 */
export function primeiroNome(nome: string | null | undefined) {
  if (!nome) return null;
  return nome.trim().split(/\s+/)[0] || null;
}

export function summarizeAddress(address: AddressLike) {
  if (!address) return null;

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  const neighborhood = parts.find((part) => /\bbairro\b/i.test(part)) ?? parts.at(-3);
  const cityOrState = parts.at(-2) ?? parts.at(-1);
  const summary = [neighborhood, cityOrState]
    .filter((part): part is string => Boolean(part))
    .join(", ");

  return summary || "Regiao aproximada";
}

export function toAdminSolicitacaoListDTO<T extends { endereco?: string | null; user?: unknown }>(
  solicitacao: T
) {
  const { user: _user, endereco, ...rest } = solicitacao;
  return {
    ...rest,
    regiao: summarizeAddress(endereco),
  };
}

export function toEmpresaSolicitacaoDisponivelDTO<
  T extends { endereco?: string | null; user?: { nome?: string | null } | null }
>(solicitacao: T) {
  const { user, endereco, ...rest } = solicitacao;
  const regiao = summarizeAddress(endereco);

  return {
    ...rest,
    endereco: regiao,
    regiao,
    // Só o primeiro nome — endereço exato, telefone e email do solicitante
    // continuam escondidos até a empresa aceitar a solicitação.
    solicitanteNome: primeiroNome(user?.nome),
  };
}
