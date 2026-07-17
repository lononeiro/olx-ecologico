import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Send } from "lucide-react-native";
import { AppCard, appColors } from "@/components/AppUI";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { radius, spacing, typography } from "@/theme/tokens";
import {
  getReadableErrorMessage,
  sendMensagem,
  type MessageItem,
} from "@/lib/api";

export function ChatThread({
  coletaId,
  threadId,
  accessToken,
  currentUserId,
  messages,
  title = "Conversa",
  description,
  emptyText = "Nenhuma mensagem ainda. Inicie a conversa por aqui.",
  placeholder = "Escreva uma mensagem",
  queryKey,
  onSend,
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
}) {
  const queryClient = useQueryClient();
  const resolvedThreadId = threadId ?? coletaId;
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!mensagem.trim()) {
        throw new Error("Digite uma mensagem antes de enviar.");
      }

      if (onSend) return onSend(mensagem.trim());
      if (!coletaId) throw new Error("Conversa não configurada.");

      return sendMensagem(accessToken, coletaId, mensagem.trim());
    },
    onSuccess: () => {
      setMensagem("");
      setErro("");
      void queryClient.invalidateQueries({ queryKey: queryKey ?? ["detail", resolvedThreadId] });
    },
    onError: (error) => {
      setErro(getReadableErrorMessage(error, "Não foi possível enviar a mensagem."));
    },
  });

  return (
    <AppCard>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}

      {messages.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View style={styles.thread}>
          {messages.map((item) => {
            const own = item.remetenteId === currentUserId;

            return (
              <View
                key={item.id}
                style={[
                  styles.bubble,
                  own ? styles.bubbleOwn : styles.bubbleOther,
                ]}
              >
                <Text style={[styles.sender, own && styles.senderOwn]}>
                  {item.remetente.nome}
                </Text>
                <Text style={[styles.message, own && styles.messageOwn]}>
                  {item.mensagem}
                </Text>
                <Text style={[styles.timestamp, own && styles.timestampOwn]}>
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </Text>
              </View>
            );
          })}
        </View>
      )}

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
          disabled={sendMutation.isPending}
          style={({ pressed }) => [
            styles.sendButton,
            (pressed || sendMutation.isPending) && styles.sendButtonPressed,
          ]}
        >
          <Icon icon={Send} size={20} color={appColors.white} strokeWidth={2} />
        </Pressable>
      </View>
    </AppCard>
  );
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
  empty: {
    ...typography.body,
    color: appColors.textSoft,
  },
  thread: {
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    gap: 4,
  },
  bubbleOwn: {
    alignSelf: "flex-end",
    backgroundColor: appColors.primary,
    borderColor: appColors.primaryStrong,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: appColors.surfaceTint,
    borderColor: appColors.stroke,
  },
  sender: {
    ...typography.meta,
    fontSize: 11,
    color: appColors.textSoft,
  },
  senderOwn: {
    color: "rgba(255,255,255,0.85)",
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
  },
  timestampOwn: {
    color: "rgba(255,255,255,0.7)",
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
  sendButtonPressed: {
    opacity: 0.85,
  },
});
