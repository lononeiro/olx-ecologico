import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MessageSquare, Send } from "lucide-react-native";
import { AppCard, appColors } from "@/components/AppUI";
import { Field } from "@/components/ui/Field";
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
  placeholder = "Escreva uma mensagem",
  queryKey,
  onSend,
  onFetch,
  disabled = false,
  disabledText = "Esta conversa não está mais aberta para novas mensagens.",
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
}) {
  const queryClient = useQueryClient();
  const resolvedThreadId = threadId ?? coletaId;
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

  return (
    <AppCard>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}

      {messages.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon icon={MessageSquare} size={26} color={appColors.textFaint} strokeWidth={1.6} />
          <Text style={styles.empty}>{emptyText}</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((item) => {
            const own = item.remetenteId === currentUserId;

            return (
              <View
                key={item.id}
                style={[styles.row, own ? styles.rowOwn : styles.rowOther]}
              >
                <View
                  style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}
                >
                  {!own && <Text style={styles.sender}>{item.remetente.nome}</Text>}
                  <Text style={[styles.message, own && styles.messageOwn]}>
                    {item.mensagem}
                  </Text>
                  <Text style={[styles.timestamp, own && styles.timestampOwn]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {disabled ? (
        <Text style={styles.disabledText}>{disabledText}</Text>
      ) : (
        <View style={styles.composer}>
          <View style={styles.composerField}>
            <Field
              label="Nova mensagem"
              value={mensagem}
              onChangeText={(value) => {
                setErro("");
                setMensagem(value);
              }}
              placeholder={placeholder}
              multiline
              error={erro}
            />
          </View>
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
              <Icon icon={Send} size={20} color={appColors.white} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      )}
    </AppCard>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
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

const styles = StyleSheet.create({
  title: {
    ...typography.sectionTitle,
    color: appColors.text,
  },
  description: {
    ...typography.body,
    color: appColors.textSoft,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: appColors.textSoft,
    textAlign: "center",
  },
  thread: {
    maxHeight: 360,
    borderRadius: radius.sm,
    backgroundColor: appColors.surfaceTint,
    borderWidth: 1,
    borderColor: appColors.stroke,
  },
  threadContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    padding: spacing.md,
    gap: 4,
  },
  bubbleOwn: {
    backgroundColor: appColors.primary,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.stroke,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: radius.md,
  },
  sender: {
    ...typography.meta,
    fontSize: 11,
    color: appColors.primary,
  },
  message: {
    ...typography.body,
    color: appColors.text,
  },
  messageOwn: {
    color: appColors.white,
  },
  timestamp: {
    ...typography.meta,
    fontSize: 11,
    color: appColors.textFaint,
    textAlign: "right",
  },
  timestampOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  disabledText: {
    ...typography.meta,
    fontWeight: "500",
    color: appColors.textSoft,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  composerField: {
    flex: 1,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
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
});
