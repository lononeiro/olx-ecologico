import { prisma } from "@/lib/prisma";

/**
 * Integração com a Expo Push API para notificações no app mobile.
 *
 * Tokens são "Expo push tokens" (ExponentPushToken[...]) enviados pelo device
 * após o login. Todo o envio é best-effort: qualquer falha é registrada e
 * engolida para nunca quebrar o fluxo principal (mesma filosofia de
 * `criarNotificacao` em notificacao.service.ts).
 */

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const LOTE_MAXIMO = 100;

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/** Salva/atualiza o token do device, reatribuindo ao usuário atual se necessário. */
export async function salvarPushToken(
  userId: number,
  token: string,
  platform?: string | null
) {
  return prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform: platform ?? null },
    update: { userId, platform: platform ?? null },
  });
}

export async function removerPushToken(token: string) {
  try {
    await prisma.pushToken.deleteMany({ where: { token } });
  } catch (err) {
    console.error("[push] falha ao remover token:", err);
  }
}

function chunk<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

/**
 * Envia uma notificação push para todos os devices do usuário.
 * Remove tokens que a Expo reportar como `DeviceNotRegistered`.
 */
export async function enviarPushParaUsuario(userId: number, payload: PushPayload) {
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    for (const lote of chunk(tokens, LOTE_MAXIMO)) {
      const mensagens = lote.map(({ token }) => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default" as const,
        priority: "high" as const,
        channelId: "default",
      }));

      const res = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(mensagens),
      });
      const json = await res.json().catch(() => null);

      // Recibos vêm em ordem; remove tokens inválidos para não insistir.
      const recibos = (json?.data ?? []) as Array<{
        status?: string;
        details?: { error?: string };
      }>;
      const invalidos: string[] = [];
      recibos.forEach((recibo, i) => {
        if (
          recibo?.status === "error" &&
          recibo?.details?.error === "DeviceNotRegistered"
        ) {
          const alvo = lote[i]?.token;
          if (alvo) invalidos.push(alvo);
        }
      });
      if (invalidos.length > 0) {
        await prisma.pushToken.deleteMany({ where: { token: { in: invalidos } } });
      }
    }
  } catch (err) {
    console.error("[push] falha ao enviar push:", err);
  }
}
