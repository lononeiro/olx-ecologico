import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MessageSquare, Send } from "lucide-react-native";
import { AppCard, appColors } from "@/components/AppUI";
import { Icon } from "@/components/ui/Icon";
import { radius, spacing, typography } from "@/theme/tokens";
import {
  getReadableErrorMessage,
  sendMensagem,
  type MessageItem,
} from "@/lib/api";

// Intervalo de atualização da conversa (espelha o web: 10s).
const POLL_INTERVAL_MS = 10000;

export function ChatThread({
  coletaId,
  threadId,
  accessToken,
  currentUserId,
  messages: initialMessages,
  title = "Conversa",
  description,
  emptyText = "Nenhuma mensagem ainda. Inicie a conversa por aqui.",
  placeholder = "Mensagem",
  queryKey,
  onSend,
  onFetch,
  disabled = false,
  disabledText = "Esta conversa não está mais aberta para novas mensagens.",
  variant = "card",
  showSenderName,
}: {
  coletaId?: number;
  threadId?: number;
  accessToken: string;
  currentUserId: number;
  messages: MessageItem[];
  title?: string;
  description?: string;
  emptyText?: string;
  placeholder?: string;
  queryKey?: unknown[];
  onSend?: (mensagem: string) => Promise<MessageItem>;
  onFetch?: (sinceId?: number) => Promise<MessageItem[]>;
  disabled?: boolean;
  disabledText?: string;
  /** "card": embutido (bounded). "screen": ocupa a tela inteira estilo WhatsApp. */
  variant?: "card" | "screen";
  /** Mostra o nome do remetente nas bolhas recebidas (útil em conversas com várias empresas). */
  showSenderName?: boolean;
}) {
  const queryClient = useQueryClient();
  const isScreen = variant === "screen";
  const senderVisible = showSenderName ?? !isScreen;
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const lastIdRef = useRef<number | null>(getLastMessageId(initialMessages));
  // Mantém a referência mais recente de onFetch sem reiniciar o polling.
  const onFetchRef = useRef(onFetch);
  onFetchRef.current = onFetch;

  // Sincroniza mensagens vindas de props (ex.: refetch da tela) com o estado local.
  useEffect(() => {
    if (initialMessages.length === 0) return;
    setMessages((current) => mergeMessages(current, initialMessages));
  }, [initialMessages]);

  // Polling incremental: busca apenas mensagens novas (sinceId) a cada 10s.
  useEffect(() => {
    if (!onFetchRef.current) return;
    let disposed = false;

    const poll = async () => {
      const fetcher = onFetchRef.current;
      if (!fetcher) return;
      try {
        const incoming = await fetcher(lastIdRef.current ?? undefined);
        if (disposed || !incoming?.length) return;
        setMessages((current) => mergeMessages(current, incoming));
      } catch {
        // Silencioso: mantém as mensagens já carregadas em caso de falha de rede.
      }
    };

    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    lastIdRef.current = getLastMessageId(messages);
  }, [messages]);

  // Pré-calcula separadores de data e agrupamento de bolhas por remetente.
  const rows = useMemo(() => buildRows(messages, currentUserId), [messages, currentUserId]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const texto = mensagem.trim();
      if (!texto) {
        throw new Error("Digite uma mensagem antes de enviar.");
      }

      if (onSend) return onSend(texto);
      if (!coletaId) throw new Error("Conversa não configurada.");

      return sendMensagem(accessToken, coletaId, texto);
    },
    onSuccess: (nova) => {
      setMensagem("");
      setErro("");
      setMessages((current) => mergeMessages(current, [nova]));
      scrollToBottom();
      if (queryKey) void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      setErro(getReadableErrorMessage(error, "Não foi possível enviar a mensagem."));
    },
  });

  const podeEnviar = !disabled && !sendMutation.isPending && !!mensagem.trim();

  const thread =
    rows.length === 0 ? (
      <View style={styles.emptyBox}>
        <Icon icon={MessageSquare} size={26} color={appColors.textFaint} strokeWidth={1.6} />
        <Text style={styles.empty}>{emptyText}</Text>
      </View>
    ) : (
      <ScrollView
        ref={scrollRef}
        style={isScreen ? styles.threadScreen : styles.thread}
        contentContainerStyle={styles.threadContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
      >
        {rows.map((row) => {
          if (row.type === "date") {
            return (
              <View key={row.key} style={styles.dateRow}>
                <View style={styles.datePill}>
                  <Text style={styles.dateText}>{row.label}</Text>
                </View>
              </View>
            );
          }

          const { item, own, firstOfGroup, lastOfGroup } = row;
          return (
            <View
              key={item.id}
              style={[
                styles.row,
                own ? styles.rowOwn : styles.rowOther,
                !firstOfGroup && styles.rowGrouped,
              ]}
            >
              {!own && (
                <View style={styles.avatarCol}>
                  {lastOfGroup ? (
                    item.remetente.avatarUrl ? (
                      <Image source={{ uri: item.remetente.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {item.remetente.nome?.trim()?.[0]?.toUpperCase() ?? "?"}
                        </Text>
                      </View>
                    )
                  ) : null}
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  own ? styles.bubbleOwn : styles.bubbleOther,
                  firstOfGroup && (own ? styles.tailOwn : styles.tailOther),
                  lastOfGroup && styles.bubbleGroupEnd,
                ]}
              >
                {!own && senderVisible && firstOfGroup && (
                  <Text style={styles.sender}>{item.remetente.nome}</Text>
                )}
                <View style={styles.bubbleInner}>
                  <Text style={[styles.message, own && styles.messageOwn]}>
                    {item.mensagem}
                  </Text>
                  <Text style={[styles.timestamp, own && styles.timestampOwn]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );

  const composer = disabled ? (
    <View style={styles.disabledBox}>
      <Text style={styles.disabledText}>{disabledText}</Text>
    </View>
  ) : (
    <View style={styles.composerWrap}>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={mensagem}
          onChangeText={(value) => {
            setErro("");
            setMensagem(value);
          }}
          placeholder={placeholder}
          placeholderTextColor={appColors.textFaint}
          multiline
        />
        <Pressable
          onPress={() => sendMutation.mutate()}
          disabled={!podeEnviar}
          style={({ pressed }) => [
            styles.sendButton,
            !podeEnviar && styles.sendButtonDisabled,
            pressed && podeEnviar && styles.sendButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color={appColors.white} />
          ) : (
            <Icon icon={Send} size={19} color={appColors.white} strokeWidth={2} />
          )}
        </Pressable>
      </View>
      {!!erro && <Text style={styles.errorText}>{erro}</Text>}
    </View>
  );

  if (isScreen) {
    return (
      <View style={styles.screen}>
        <View style={styles.screenThread}>{thread}</View>
        {composer}
      </View>
    );
  }

  return (
    <AppCard>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {thread}
      <View style={{ height: spacing.sm }} />
      {composer}
    </AppCard>
  );
}

type Row =
  | { type: "date"; key: string; label: string }
  | {
      type: "message";
      item: MessageItem;
      own: boolean;
      firstOfGroup: boolean;
      lastOfGroup: boolean;
    };

function buildRows(messages: MessageItem[], currentUserId: number): Row[] {
  const rows: Row[] = [];

  messages.forEach((item, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const own = item.remetenteId === currentUserId;

    const novoDia = !prev || !sameDay(prev.createdAt, item.createdAt);
    if (novoDia) {
      rows.push({
        type: "date",
        key: `date-${item.id}`,
        label: formatDaySeparator(item.createdAt),
      });
    }

    const firstOfGroup = novoDia || !prev || prev.remetenteId !== item.remetenteId;
    const lastOfGroup =
      !next ||
      next.remetenteId !== item.remetenteId ||
      !sameDay(item.createdAt, next.createdAt);

    rows.push({ type: "message", item, own, firstOfGroup, lastOfGroup });
  });

  return rows;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function formatDaySeparator(value: string) {
  const date = new Date(value);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (sameDay(value, hoje.toISOString())) return "Hoje";
  if (sameDay(value, ontem.toISOString())) return "Ontem";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: date.getFullYear() === hoje.getFullYear() ? undefined : "numeric",
  });
}

function getLastMessageId(messages: MessageItem[]) {
  return messages[messages.length - 1]?.id ?? null;
}

function mergeMessages(current: MessageItem[], incoming: MessageItem[]) {
  if (incoming.length === 0) return current;

  const seen = new Set(current.map((message) => message.id));
  const novas = incoming.filter((message) => !seen.has(message.id));
  if (novas.length === 0) return current;

  return [...current, ...novas].sort((a, b) => a.id - b.id);
}

const CHAT_BG = "#ECE5DD"; // tom de fundo estilo WhatsApp

const styles = StyleSheet.create({
  title: {
    ...typography.sectionTitle,
    color: appColors.text,
  },
  description: {
    ...typography.body,
    color: appColors.textSoft,
    marginBottom: spacing.sm,
  },

  // Layout de tela cheia
  screen: {
    flex: 1,
  },
  screenThread: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: CHAT_BG,
    borderWidth: 1,
    borderColor: appColors.stroke,
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    backgroundColor: CHAT_BG,
    borderRadius: radius.md,
  },
  empty: {
    ...typography.body,
    color: appColors.textSoft,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },

  thread: {
    maxHeight: 360,
    borderRadius: radius.sm,
    backgroundColor: CHAT_BG,
    borderWidth: 1,
    borderColor: appColors.stroke,
  },
  threadScreen: {
    flex: 1,
    backgroundColor: CHAT_BG,
  },
  threadContent: {
    padding: spacing.md,
    gap: 2,
  },

  // Separador de data
  dateRow: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  datePill: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dateText: {
    ...typography.meta,
    fontSize: 11,
    color: appColors.textSoft,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.sm,
  },
  rowGrouped: {
    marginTop: 2,
  },
  avatarCol: {
    width: 28,
    marginRight: 6,
    justifyContent: "flex-end",
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appColors.primarySoft,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.primary,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 5,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleOwn: {
    backgroundColor: "#DCF8C6", // verde claro estilo WhatsApp (mensagem enviada)
  },
  bubbleOther: {
    backgroundColor: appColors.surface,
  },
  bubbleGroupEnd: {
    marginBottom: 1,
  },
  // "Rabinho" no topo da primeira bolha de cada grupo
  tailOwn: {
    borderTopRightRadius: 4,
  },
  tailOther: {
    borderTopLeftRadius: 4,
  },

  bubbleInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  sender: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.primary,
    marginBottom: 1,
  },
  message: {
    ...typography.body,
    color: appColors.text,
    flexShrink: 1,
  },
  messageOwn: {
    color: "#0B2E13",
  },
  timestamp: {
    ...typography.meta,
    fontSize: 10,
    color: appColors.textFaint,
    marginLeft: spacing.sm,
    marginBottom: 1,
  },
  timestampOwn: {
    color: "rgba(11,46,19,0.45)",
  },

  // Composer
  composerWrap: {
    gap: 4,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.stroke,
    borderRadius: radius.lg,
    ...typography.body,
    color: appColors.text,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },

  disabledBox: {
    paddingTop: spacing.sm,
  },
  disabledText: {
    ...typography.meta,
    fontWeight: "500",
    color: appColors.textSoft,
    textAlign: "center",
  },
  errorText: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.dangerText,
  },
});
