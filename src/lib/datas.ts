/**
 * Formatação de datas no fuso do Brasil.
 *
 * As datas são salvas em UTC no banco. Componentes de servidor (Vercel roda em
 * UTC) formatariam em UTC sem `timeZone`, mostrando o horário adiantado ~3h.
 * Fixar o fuso garante o mesmo resultado no servidor e no cliente.
 */
const FUSO = "America/Sao_Paulo";
const LOCALE = "pt-BR";

type Entrada = Date | string | number;

/** Ex.: 08/08/2026 09:00 */
export function formatarDataHora(
  valor: Entrada,
  opcoes: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" }
): string {
  return new Date(valor).toLocaleString(LOCALE, { timeZone: FUSO, ...opcoes });
}

/** Ex.: 08/08/2026 */
export function formatarData(
  valor: Entrada,
  opcoes: Intl.DateTimeFormatOptions = {}
): string {
  return new Date(valor).toLocaleDateString(LOCALE, { timeZone: FUSO, ...opcoes });
}

/** Ex.: 09:00 */
export function formatarHora(
  valor: Entrada,
  opcoes: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  return new Date(valor).toLocaleTimeString(LOCALE, { timeZone: FUSO, ...opcoes });
}
