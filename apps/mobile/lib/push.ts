import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

/**
 * Push remoto foi removido do Expo Go no SDK 53 — tocar no módulo
 * `expo-notifications` lá lança erro e derruba o app. Por isso:
 *  - detectamos o Expo Go de forma robusta (dois sinais);
 *  - só carregamos `expo-notifications`/`expo-device` sob demanda e fora do
 *    Expo Go (o módulo nunca é avaliado lá).
 * No Expo Go o app roda normal, só sem push — a central in-app e o refresh
 * quase-real-time (polling) não dependem disso.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as { appOwnership?: string }).appOwnership === "expo";

type NotificationsModule = typeof import("expo-notifications");
type DeviceModule = typeof import("expo-device");

let notificationsCache: NotificationsModule | null | undefined;

/** Carrega expo-notifications só quando suportado; null no Expo Go. */
function getNotifications(): NotificationsModule | null {
  if (notificationsCache !== undefined) return notificationsCache;
  if (isExpoGo) {
    notificationsCache = null;
    return null;
  }
  try {
    notificationsCache = require("expo-notifications") as NotificationsModule;
  } catch {
    notificationsCache = null;
  }
  return notificationsCache;
}

/** Mostra banner mesmo com o app em primeiro plano. */
export function configurarHandlerNotificacoes() {
  const N = getNotifications();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // ambiente sem suporte: segue sem handler
  }
}

function getProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

/**
 * Pede permissão, configura o canal Android e retorna o Expo push token.
 * Retorna null quando não é possível (Expo Go, emulador, permissão negada).
 */
export async function registrarParaPush(): Promise<string | null> {
  const N = getNotifications();
  if (!N) return null;

  let Device: DeviceModule;
  try {
    Device = require("expo-device") as DeviceModule;
  } catch {
    return null;
  }
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("default", {
      name: "Padrão",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2D6A4F",
    });
  }

  const atual = await N.getPermissionsAsync();
  let status = atual.status;
  if (status !== "granted") {
    const pedido = await N.requestPermissionsAsync();
    status = pedido.status;
  }
  if (status !== "granted") return null;

  try {
    const projectId = getProjectId();
    const resposta = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return resposta.data;
  } catch (err) {
    console.warn("[push] falha ao obter token:", err);
    return null;
  }
}

/**
 * Registra listeners de notificação recebida/tocada. No Expo Go é no-op.
 * Retorna a função de cleanup.
 */
export function registrarListenersNotificacao(handlers: {
  onRecebida?: () => void;
  onToque?: (href?: string | null) => void;
}): () => void {
  const N = getNotifications();
  if (!N) return () => {};

  const lerHref = (resp: import("expo-notifications").NotificationResponse) =>
    (resp.notification.request.content.data as { href?: string })?.href;

  const recebida = N.addNotificationReceivedListener(() => handlers.onRecebida?.());
  const respondida = N.addNotificationResponseReceivedListener((resp) =>
    handlers.onToque?.(lerHref(resp))
  );

  return () => {
    recebida.remove();
    respondida.remove();
  };
}

/** Converte o href gravado no banco (web) na rota equivalente do expo-router. */
export function mapearHrefParaRota(href?: string | null): string | null {
  if (!href) return null;
  const [caminho] = href.split("?");

  const solic = caminho.match(/^\/dashboard\/solicitacoes\/(\d+)/);
  if (solic) return `/solicitacoes/${solic[1]}`;

  const coleta = caminho.match(/^\/empresa\/coletas\/(\d+)/);
  if (coleta) return `/empresa/coletas/${coleta[1]}`;

  if (caminho.startsWith("/dashboard/mensagens")) return "/mensagens";
  if (caminho.startsWith("/empresa/mensagens")) return "/empresa/mensagens";
  if (caminho.startsWith("/empresa/solicitacoes")) return "/empresa/solicitacoes";
  if (caminho.startsWith("/empresa/avaliacoes")) return "/empresa";

  return null;
}
