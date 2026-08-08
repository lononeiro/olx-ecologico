import { sanitizeCNPJ } from "../../packages/shared/src/cnpj";

export { sanitizeCNPJ, formatCNPJ, isValidCNPJ } from "../../packages/shared/src/cnpj";

export type CnpjCheck =
  | { ok: true }
  | { ok: false; status: 400 | 502; message: string };

/**
 * Confirma que o CNPJ existe e está com situação cadastral ATIVA na Receita
 * Federal, consultando a BrasilAPI. Deve ser chamado apenas depois da
 * validação dos dígitos verificadores (isValidCNPJ).
 *
 * - CNPJ inexistente         -> 400 (erro do usuário)
 * - situação != ATIVA        -> 400 (erro do usuário)
 * - API indisponível/timeout -> 502 (bloqueia para não deixar entrar sem validar)
 */
export async function verificarCnpjNaReceita(cnpj: string): Promise<CnpjCheck> {
  const digits = sanitizeCNPJ(cnpj);

  let res: Response;
  try {
    res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Não foi possível validar o CNPJ na Receita agora. Tente novamente em instantes.",
    };
  }

  if (res.status === 404) {
    return { ok: false, status: 400, message: "CNPJ não encontrado na Receita Federal." };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: 502,
      message: "Não foi possível validar o CNPJ na Receita agora. Tente novamente em instantes.",
    };
  }

  let data: { descricao_situacao_cadastral?: string; situacao_cadastral?: number };
  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      status: 502,
      message: "Não foi possível validar o CNPJ na Receita agora. Tente novamente em instantes.",
    };
  }

  // BrasilAPI: situacao_cadastral 2 = ATIVA; descricao_situacao_cadastral = "ATIVA"
  const descricao = (data.descricao_situacao_cadastral ?? "").toUpperCase();
  const ativa = data.situacao_cadastral === 2 || descricao === "ATIVA";
  if (!ativa) {
    return {
      ok: false,
      status: 400,
      message: `CNPJ com situação cadastral "${data.descricao_situacao_cadastral ?? "desconhecida"}". Apenas empresas ativas podem se cadastrar.`,
    };
  }

  return { ok: true };
}
